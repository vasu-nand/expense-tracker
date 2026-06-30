import { Router } from 'express';
import Settings from '../models/Settings';

const router = Router();

// GET /api/settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        res.json({ settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/settings
router.put('/settings', async (req, res) => {
    try {
        const { themeMode, themeConfig } = req.body;
        
        // Find the single settings document and update, or create one if none exists
        const settings = await Settings.findOneAndUpdate(
            {},
            { themeMode, themeConfig },
            { new: true, upsert: true, runValidators: true }
        );
        
        res.json({ settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
