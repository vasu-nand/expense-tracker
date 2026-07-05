import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Expense from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import BankAccount from '../models/BankAccount';
import Category from '../models/Category';
import Settings from '../models/Settings';

dotenv.config();

const DEFAULT_BACKUP_PATH = path.join(__dirname, '../../../db_backup.json');

async function exportData(mongoUri: string, backupPath: string) {
    console.log(`Connecting to source database to export: ${mongoUri}`);
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to source database.');

        console.log('Fetching expenses...');
        const expenses = await Expense.find({}).lean();
        console.log(`Found ${expenses.length} expenses.`);

        console.log('Fetching monthly summaries...');
        const summaries = await MonthlySummary.find({}).lean();
        console.log(`Found ${summaries.length} monthly summaries.`);

        console.log('Fetching bank accounts...');
        const bankAccounts = await BankAccount.find({}).lean();
        console.log(`Found ${bankAccounts.length} bank accounts.`);

        console.log('Fetching categories...');
        const categories = await Category.find({}).lean();
        console.log(`Found ${categories.length} categories.`);

        console.log('Fetching settings...');
        const settings = await Settings.find({}).lean();
        console.log(`Found ${settings.length} settings.`);

        const backupData = {
            expenses,
            summaries,
            bankAccounts,
            categories,
            settings
        };

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
        console.log(`Database backup written successfully to: ${backupPath}`);
    } catch (error) {
        console.error('Error during database export:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    }
}

async function importData(mongoUri: string, backupPath: string) {
    const resolvedPath = path.resolve(backupPath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Backup file not found at: ${resolvedPath}`);
        process.exit(1);
    }

    console.log(`Connecting to target database to import: ${mongoUri}`);
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to target database.');

        const rawData = fs.readFileSync(resolvedPath, 'utf-8');
        const backupData = JSON.parse(rawData);

        // Import Expenses
        if (backupData.expenses && Array.isArray(backupData.expenses)) {
            console.log(`Clearing existing expenses in target database...`);
            await Expense.deleteMany({});
            console.log(`Inserting ${backupData.expenses.length} expenses...`);
            if (backupData.expenses.length > 0) {
                await Expense.insertMany(backupData.expenses);
            }
            console.log('Expenses imported successfully.');
        }

        // Import Summaries
        if (backupData.summaries && Array.isArray(backupData.summaries)) {
            console.log(`Clearing existing monthly summaries in target database...`);
            await MonthlySummary.deleteMany({});
            console.log(`Inserting ${backupData.summaries.length} monthly summaries...`);
            if (backupData.summaries.length > 0) {
                await MonthlySummary.insertMany(backupData.summaries);
            }
            console.log('Monthly summaries imported successfully.');
        }

        // Import Bank Accounts
        if (backupData.bankAccounts && Array.isArray(backupData.bankAccounts)) {
            console.log(`Clearing existing bank accounts in target database...`);
            await BankAccount.deleteMany({});
            console.log(`Inserting ${backupData.bankAccounts.length} bank accounts...`);
            if (backupData.bankAccounts.length > 0) {
                await BankAccount.insertMany(backupData.bankAccounts);
            }
            console.log('Bank accounts imported successfully.');
        }

        // Import Categories
        if (backupData.categories && Array.isArray(backupData.categories)) {
            console.log(`Clearing existing categories in target database...`);
            await Category.deleteMany({});
            console.log(`Inserting ${backupData.categories.length} categories...`);
            if (backupData.categories.length > 0) {
                await Category.insertMany(backupData.categories);
            }
            console.log('Categories imported successfully.');
        }

        // Import Settings
        if (backupData.settings && Array.isArray(backupData.settings)) {
            console.log(`Clearing existing settings in target database...`);
            await Settings.deleteMany({});
            console.log(`Inserting ${backupData.settings.length} settings...`);
            if (backupData.settings.length > 0) {
                await Settings.insertMany(backupData.settings);
            }
            console.log('Settings imported successfully.');
        }

        console.log('Database import completed successfully!');
    } catch (error) {
        console.error('Error during database import:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database.');
    }
}

async function main() {
    const action = process.argv[2]; // 'export' or 'import'
    const customPath = process.argv[3] || DEFAULT_BACKUP_PATH;
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/expense_dashboard';

    if (action === 'export') {
        await exportData(mongoUri, customPath);
    } else if (action === 'import') {
        await importData(mongoUri, customPath);
    } else {
        console.error('Usage: ts-node dbSync.ts [export|import] [optional_backup_path]');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
