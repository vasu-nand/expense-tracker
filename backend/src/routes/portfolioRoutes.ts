import { Router } from 'express';
import {
    getPortfolioSummary,
    getAssets,
    createAsset,
    getTransactions,
    addTransaction,
    deleteTransaction,
    getDividends,
    addDividend,
    deleteDividend,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    getGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getAlerts,
    addAlert,
    deleteAlert
} from '../controllers/portfolioController';

const router = Router();

router.get('/portfolio/summary', getPortfolioSummary);
router.get('/portfolio/assets', getAssets);
router.post('/portfolio/assets', createAsset);

router.get('/portfolio/transactions', getTransactions);
router.post('/portfolio/transactions', addTransaction);
router.delete('/portfolio/transactions/:id', deleteTransaction);

router.get('/portfolio/dividends', getDividends);
router.post('/portfolio/dividends', addDividend);
router.delete('/portfolio/dividends/:id', deleteDividend);

router.get('/portfolio/watchlist', getWatchlist);
router.post('/portfolio/watchlist', addToWatchlist);
router.delete('/portfolio/watchlist/:id', removeFromWatchlist);

router.get('/portfolio/goals', getGoals);
router.post('/portfolio/goals', addGoal);
router.put('/portfolio/goals/:id', updateGoal);
router.delete('/portfolio/goals/:id', deleteGoal);

router.get('/portfolio/alerts', getAlerts);
router.post('/portfolio/alerts', addAlert);
router.delete('/portfolio/alerts/:id', deleteAlert);

export default router;
