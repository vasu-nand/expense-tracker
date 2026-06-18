import { Router } from 'express';
import multer from 'multer';
import {
    uploadExpenses,
    getExpenses,
    getExpenseById,
    deleteExpense,
    getDailySummary,
    createExpense,
    updateExpense
} from '../controllers/expenseController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadExpenses);
router.get('/expenses', getExpenses);
router.get('/expenses/:id', getExpenseById);
router.delete('/expenses/:id', deleteExpense);
router.get('/daily-summary', getDailySummary);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);

export default router;