import { listRoomTypes, listRooms } from '../services/roomTypeService.js';
import { listBlocks, createBlock, liftBlock } from '../services/roomBlockService.js';

export async function getCategories(_req, res) {
  res.json({ success: true, data: await listRoomTypes({ activeOnly: true }) });
}

export async function getRooms(_req, res) {
  res.json({ success: true, data: await listRooms() });
}

export async function getBlocks(req, res) {
  res.json({ success: true, data: await listBlocks(req.validated.query) });
}

export async function postBlock(req, res) {
  const block = await createBlock({ roomId: req.validated.params.id, ...req.validated.body });
  res.status(201).json({ success: true, data: block });
}

export async function deleteBlock(req, res) {
  res.json({ success: true, data: await liftBlock(req.validated.params.blockId) });
}
