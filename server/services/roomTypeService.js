import { RoomType, Room } from '../models/index.js';

/** Active room types with their rates, cheapest first. */
export async function listRoomTypes({ activeOnly = true } = {}) {
  const types = await RoomType.find(activeOnly ? { isActive: true } : {}).sort({ pricePerNight: 1, name: 1 }).lean();
  return types.map(serializeRoomType);
}

/** Map of type name → type, for joining rooms to their rate in one query. */
export async function activeRoomTypesByName() {
  const types = await RoomType.find({ isActive: true }).lean();
  return new Map(types.map((t) => [t.name, t]));
}

/** All rooms with their rate, for the room picker in the blocks panel. */
export async function listRooms() {
  const [rooms, types] = await Promise.all([Room.find().sort({ category: 1, roomNumber: 1 }).lean(), activeRoomTypesByName()]);
  return rooms.map((room) => ({
    id: String(room._id),
    roomNumber: room.roomNumber,
    category: room.category,
    bedCount: room.bedCount,
    isActive: room.isActive,
    pricePerNight: types.get(room.category)?.pricePerNight ?? null,
  }));
}

export function serializeRoomType(t) {
  return { id: String(t._id), name: t.name, pricePerNight: t.pricePerNight, isActive: t.isActive };
}
