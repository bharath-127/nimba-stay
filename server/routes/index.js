import { Router } from 'express';
import availabilityRoutes from './availabilityRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import roomRoutes from './roomRoutes.js';
import statsRoutes from './statsRoutes.js';

const router = Router();

router.use('/availability', availabilityRoutes);
router.use('/bookings', bookingRoutes);
router.use('/rooms', roomRoutes);
router.use('/stats', statsRoutes);

export default router;
