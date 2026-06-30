import { Router } from 'express';
import crypto from 'crypto';
import * as categoryService from '../services/categoryService';

const router = Router();

// GET all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.json({ categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST add new category
router.post('/categories', async (req, res) => {
    try {
        const { name, color, keywords } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const category = await categoryService.createCategory({ name, color, keywords });
        res.status(201).json({ category });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update category
router.put('/categories/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { color, keywords } = req.body;
        const category = await categoryService.updateCategory(name, { color, keywords });
        res.json({ category });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE category
router.delete('/categories/:name', async (req, res) => {
    try {
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

        await categoryService.deleteCategory(name);
        res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST reset to defaults
router.post('/categories/reset', async (req, res) => {
    try {
        const categories = await categoryService.resetToDefaultCategories();
        res.json({ message: 'Categories reset to predefined values successfully', categories });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
