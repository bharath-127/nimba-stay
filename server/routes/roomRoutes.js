import { Router } from 'express';
import { getCategories } from '../controllers/roomController.js';

const router = Router();

// GET /api/rooms/categories
router.get('/categories', getCategories);

export default router;
