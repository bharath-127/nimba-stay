import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { roomIdParamsSchema, blockIdParamsSchema, createBlockSchema, listBlocksQuerySchema } from '../validators/schemas.js';
import { getCategories, getRooms, getBlocks, postBlock, deleteBlock } from '../controllers/roomController.js';

const router = Router();

// GET /api/rooms                      all rooms with rate and active flag
router.get('/', getRooms);
// GET /api/rooms/categories           active room types with rates
router.get('/categories', getCategories);
// GET /api/rooms/blocks?includeEnded= current and upcoming blocks
router.get('/blocks', validate({ query: listBlocksQuerySchema }), getBlocks);
// POST /api/rooms/:id/blocks          take a room out of service for a period
router.post('/:id/blocks', validate({ params: roomIdParamsSchema, body: createBlockSchema }), postBlock);
// DELETE /api/rooms/blocks/:blockId   lift a block
router.delete('/blocks/:blockId', validate({ params: blockIdParamsSchema }), deleteBlock);

export default router;
