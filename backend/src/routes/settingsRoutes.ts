import { Router } from 'express';
import Settings from '../models/Settings';
import { getActiveBankAccountId } from '../utils/bankAccountHelper';

const router = Router();

const defaultThemeConfig = {
    name: 'Teal Harmony',
    background: '#f0fdfa',
    card: '#ffffff',
    foreground: '#0f172a',
    border: '#e2e8f0',
    primary: '#0d9488',
    btnGradientStart: '#14b8a6',
    btnGradientEnd: '#0f766e',
    textGradientStart: '#0f766e',
    textGradientEnd: '#115e59',
    radius: '0.5rem',
    dark: {
        background: '#090d16',
        card: '#111726',
        foreground: '#f8fafc',
        border: '#1e293b',
        primary: '#94a3b8',
        btnGradientStart: '#94a3b8',
        btnGradientEnd: '#475569',
        textGradientStart: '#94a3b8',
        textGradientEnd: '#475569'
    }
};

// GET /api/settings
router.get('/settings', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        let settings: any = await Settings.findOne({ bankAccountId }).lean();
        if (!settings) {
            settings = await Settings.create({
                bankAccountId,
                themeMode: 'light',
                themeConfig: defaultThemeConfig
            });
        }
        res.json({ settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/settings
router.put('/settings', async (req, res) => {
    try {
        const bankAccountId = await getActiveBankAccountId(req);
        const { themeMode, themeConfig } = req.body;
        
        const settings = await Settings.findOneAndUpdate(
            { bankAccountId },
            { themeMode, themeConfig },
            { new: true, upsert: true, runValidators: true }
        );
        
        res.json({ settings });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
