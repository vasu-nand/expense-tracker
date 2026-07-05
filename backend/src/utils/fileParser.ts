import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { detectCategory } from './categoryDetector';

interface ParsedExpense {
    day: number;
    amount: number;
    reason: string;
    category: string;
    month: string;
    type?: 'expense' | 'income';
    bankAccountId?: string;
}

export const parseExcelFile = (buffer: Buffer, month: string, bankAccountId: string): ParsedExpense[] => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    return parseExpenses(jsonData, month, bankAccountId);
};

export const parseCSVFile = async (buffer: Buffer, month: string, bankAccountId: string): Promise<ParsedExpense[]> => {
    const csvString = buffer.toString('utf-8');
    const rows: any[] = [];

    await new Promise((resolve, reject) => {
        const stream = Readable.from(csvString);
        stream
            .pipe(csv())
            .on('data', (data) => rows.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    return parseExpenses(rows, month, bankAccountId);
};

export const parseJSONFile = (buffer: Buffer, month: string, bankAccountId: string): ParsedExpense[] => {
    const jsonString = buffer.toString('utf-8');
    const parsedData = JSON.parse(jsonString);
    
    let rawItems: any[] = [];
    if (Array.isArray(parsedData)) {
        rawItems = parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
        // Look for common transaction array keys first to handle full exports/backups clearly
        const priorityKeys = ['expenses', 'transactions', 'items', 'data'];
        const foundKey = priorityKeys.find(key => Array.isArray(parsedData[key]));
        
        if (foundKey) {
            rawItems = parsedData[foundKey];
        } else {
            // Fallback to the first key that holds an array
            const arrayKey = Object.keys(parsedData).find(key => Array.isArray(parsedData[key]));
            if (arrayKey) {
                rawItems = parsedData[arrayKey];
            } else {
                rawItems = [parsedData];
            }
        }
    }
    
    if (rawItems.length === 0) {
        throw new Error('No array of transactions found in JSON');
    }
    
    return parseExpenses(rawItems, month, bankAccountId);
};

const parseExpenses = (data: any[], month: string, bankAccountId: string): ParsedExpense[] => {
    const expenses: ParsedExpense[] = [];
    const headers = Object.keys(data[0] || {});

    // Try to map columns automatically
    const dayCol = headers.find(h => h.toLowerCase().includes('day') || h.toLowerCase().includes('date'));
    const expenseCol = headers.find(h => h.toLowerCase().includes('expense') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('income'));
    const reasonCol = headers.find(h => h.toLowerCase().includes('reason') || h.toLowerCase().includes('description') || h.toLowerCase().includes('item'));
    const typeCol = headers.find(h => h.toLowerCase().includes('type'));
    const bankAccountCol = headers.find(h => 
        h.toLowerCase().includes('bankaccount') || 
        h.toLowerCase().includes('bank_account') ||
        h.toLowerCase().includes('accountid') ||
        h.toLowerCase().includes('account_id')
    );

    if (!dayCol || !expenseCol || !reasonCol) {
        throw new Error('Could not find required columns: Day, Expense, Reason');
    }

    for (const row of data) {
        const dayRaw = row[dayCol];
        let day = parseInt(dayRaw);

        if (typeof dayRaw === 'string' && (dayRaw.includes('-') || dayRaw.includes('/'))) {
            const parsedDate = new Date(dayRaw);
            if (!isNaN(parsedDate.getTime())) {
                day = parsedDate.getDate();
            }
        }
 
        const amount = parseFloat(row[expenseCol]);
        const reason = String(row[reasonCol] || '');
        const rawType = typeCol ? String(row[typeCol] || '').trim().toLowerCase() : 'expense';
        const type: 'expense' | 'income' = (rawType === 'income' || rawType === 'earnings') ? 'income' : 'expense';

        if (isNaN(day) || isNaN(amount) || !reason) continue;

        // Use month from JSON if present, otherwise default
        const itemMonth = (row.month && typeof row.month === 'string' && /^\d{4}-\d{2}$/.test(row.month))
            ? row.month
            : month;

        // Clamp day to valid range [1, maxDays] for the selected month
        const [year, monthVal] = itemMonth.split('-').map(Number);
        const maxDays = new Date(year, monthVal, 0).getDate();
        if (day < 1) day = 1;
        if (day > maxDays) day = maxDays;

        const rowBankAccountId = bankAccountCol ? row[bankAccountCol] : undefined;
        let itemBankAccountId = rowBankAccountId || row.bankAccountId || row.bank_account_id;
        if (itemBankAccountId) {
            itemBankAccountId = String(itemBankAccountId).trim();
        }
        const validBankAccountId = (itemBankAccountId && /^[0-9a-fA-F]{24}$/.test(itemBankAccountId))
            ? itemBankAccountId
            : undefined;

        // Use category from JSON if present, otherwise auto detect
        const category = (row.category && typeof row.category === 'string') 
            ? row.category 
            : detectCategory(reason, validBankAccountId || bankAccountId);

        const parsedExpense: ParsedExpense = {
            day,
            amount,
            reason,
            category,
            month: itemMonth,
            type
        };

        if (validBankAccountId) {
            parsedExpense.bankAccountId = validBankAccountId;
        }

        expenses.push(parsedExpense);
    }

    return expenses;
};