import { Router } from 'express';
import { getAnalytics, getCategories } from '../controllers/analyticsController';

const router = Router();

router.get('/analytics', getAnalytics);
router.get('/categories/active', getCategories);

export default router;