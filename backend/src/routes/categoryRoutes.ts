import { Router } from 'express';
import crypto from 'crypto';
import * as categoryService from '../services/categoryService';
import { getActiveBankAccountId } from '../utils/bankAccountHelper';

const router = Router();

// GET all categories for the active account
router.get('/categories', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const categories = await categoryService.getAllCategories(bankAccountId);
        res.json({ categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST add new category for the active account
router.post('/categories', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const { name, color, keywords } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const category = await categoryService.createCategory({ name, color, keywords, bankAccountId });
        res.status(201).json({ category });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update category for the active account
router.put('/categories/:name', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const { name } = req.params;
        const { color, keywords } = req.body;
        const category = await categoryService.updateCategory(name, { color, keywords }, bankAccountId);
        res.json({ category });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE category for the active account
router.delete('/categories/:name', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const { name } = req.params;
        const password = req.headers['x-delete-password'] || req.query.password;
        
        if (!password) {
            return res.status(401).json({ error: 'Unauthorized: Password required for category deletion' });
        }

        const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
        const requiredHash = process.env.DELETE_PASSWORD_HASH || 'af0dce62e992efc95dc1e0985253fd368e54a32c60852cf77cf2c90bc839ecad';

        if (hash !== requiredHash) {
            return res.status(401).json({ error: 'Unauthorized: Invalid password' });
        }

        await categoryService.deleteCategory(name, bankAccountId);
        res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST reset to defaults for the active account
router.post('/categories/reset', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const categories = await categoryService.resetToDefaultCategories(bankAccountId);
        res.json({ message: 'Categories reset to predefined values successfully', categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
