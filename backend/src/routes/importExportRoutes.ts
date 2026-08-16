import { Router } from 'express';
import multer from 'multer';
import {
    importExpenses,
    importTransactions,
    importDividends,
    importAssets,
    importBankAccounts,
    importFullBackup,
    exportCSV,
    exportBackup
} from '../controllers/importExportController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Import Endpoints
router.post('/import/expenses', upload.single('file'), importExpenses);
router.post('/import/transactions', upload.single('file'), importTransactions);
router.post('/import/dividends', upload.single('file'), importDividends);
router.post('/import/assets', upload.single('file'), importAssets);
router.post('/import/bank-accounts', upload.single('file'), importBankAccounts);
router.post('/import/backup', upload.single('file'), importFullBackup);

// Export Endpoints
router.get('/export/csv', exportCSV);
router.get('/export/backup', exportBackup);

export default router;
