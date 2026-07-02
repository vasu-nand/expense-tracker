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

const parseExpenses = (data: any[], month: string, bankAccountId: string): ParsedExpense[] => {
    const expenses: ParsedExpense[] = [];
    const headers = Object.keys(data[0] || {});

    // Try to map columns automatically
    const dayCol = headers.find(h => h.toLowerCase().includes('day') || h.toLowerCase().includes('date'));
    const expenseCol = headers.find(h => h.toLowerCase().includes('expense') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('income'));
    const reasonCol = headers.find(h => h.toLowerCase().includes('reason') || h.toLowerCase().includes('description') || h.toLowerCase().includes('item'));
    const typeCol = headers.find(h => h.toLowerCase().includes('type'));

    if (!dayCol || !expenseCol || !reasonCol) {
        throw new Error('Could not find required columns: Day, Expense, Reason');
    }

    for (const row of data) {
        let day = parseInt(row[dayCol]);
        const amount = parseFloat(row[expenseCol]);
        const reason = String(row[reasonCol] || '');
        const rawType = typeCol ? String(row[typeCol] || '').trim().toLowerCase() : 'expense';
        const type: 'expense' | 'income' = (rawType === 'income' || rawType === 'earnings') ? 'income' : 'expense';

        if (isNaN(day) || isNaN(amount) || !reason) continue;

        // Clamp day to valid range [1, maxDays] for the selected month
        const [year, monthVal] = month.split('-').map(Number);
        const maxDays = new Date(year, monthVal, 0).getDate();
        if (day < 1) day = 1;
        if (day > maxDays) day = maxDays;

        expenses.push({
            day,
            amount,
            reason,
            category: detectCategory(reason, bankAccountId),
            month,
            type
        });
    }

    return expenses;
};