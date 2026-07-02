import BankAccount from '../models/BankAccount';
import Expense from '../models/Expense';
import MonthlySummary from '../models/MonthlySummary';
import Category from '../models/Category';
import Settings from '../models/Settings';
import { seedDefaultCategories } from '../services/categoryService';

export const runDatabaseMigration = async () => {
    try {
        console.log('Running database workspace migration check...');
        
        // 1. Locate or initialize the Primary Bank Account
        let primaryAccount = await BankAccount.findOne({ isPrimary: true });
        
        if (!primaryAccount) {
            primaryAccount = await BankAccount.findOne();
            if (primaryAccount) {
                primaryAccount.isPrimary = true;
                await primaryAccount.save();
            } else {
                console.log('No bank accounts found in the database. Seeding system primary account...');
                primaryAccount = new BankAccount({
                    name: 'Primary Account',
                    bankName: 'System Default Bank',
                    accountNumber: 'XXXX-0000',
                    color: '#0d9488', // Teal Harmony primary theme color
                    icon: 'Wallet',
                    isPrimary: true,
                    deletePasswordHash: 'af0dce62e992efc95dc1e0985253fd368e54a32c60852cf77cf2c90bc839ecad' // default: admin123
                });
                primaryAccount = await primaryAccount.save();
                console.log(`Default primary account created with ID: ${primaryAccount._id}`);
            }
        }

        const primaryAccountId = primaryAccount._id;

        // 2. Ensure categories exist for this primary account
        await seedDefaultCategories(primaryAccountId);

        // 3. Migrate any unassigned Expenses to the primary account
        const unassignedExpenses = await Expense.countDocuments({ bankAccountId: { $exists: false } });
        if (unassignedExpenses > 0) {
            console.log(`Migrating ${unassignedExpenses} legacy expenses to primary account...`);
            await Expense.updateMany(
                { bankAccountId: { $exists: false } }, 
                { $set: { bankAccountId: primaryAccountId } }
            );
        }

        // 4. Migrate any unassigned MonthlySummaries
        const unassignedSummaries = await MonthlySummary.countDocuments({ bankAccountId: { $exists: false } });
        if (unassignedSummaries > 0) {
            console.log(`Migrating ${unassignedSummaries} legacy monthly summaries to primary account...`);
            await MonthlySummary.updateMany(
                { bankAccountId: { $exists: false } }, 
                { $set: { bankAccountId: primaryAccountId } }
            );
        }

        // 5. Migrate any unassigned Categories
        const unassignedCategories = await Category.countDocuments({ bankAccountId: { $exists: false } });
        if (unassignedCategories > 0) {
            console.log(`Migrating ${unassignedCategories} legacy categories to primary account...`);
            await Category.updateMany(
                { bankAccountId: { $exists: false } }, 
                { $set: { bankAccountId: primaryAccountId } }
            );
        }

        // 6. Migrate any unassigned Settings
        const unassignedSettings = await Settings.countDocuments({ bankAccountId: { $exists: false } });
        if (unassignedSettings > 0) {
            console.log(`Migrating ${unassignedSettings} legacy settings to primary account...`);
            await Settings.updateMany(
                { bankAccountId: { $exists: false } }, 
                { $set: { bankAccountId: primaryAccountId } }
            );
        }

        console.log('Database workspace migration completed successfully.');
    } catch (error) {
        console.error('Error during database migration:', error);
    }
};
