import express from 'express';
import {
  getReservations,
  getPendingReservations,
  getCancelledCount,
  restoreBackorder,
  createReservation,
  updateReservationQuantity,
  cancelReservation,
  confirmBooking,
  validateBulk
} from './reservation.controller.js';
import { protect } from '../../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getReservations)
  .post(createReservation);

// Static paths must precede the '/:id' routes below, or Express matches them as an id.
router.get('/pending', getPendingReservations);
router.get('/cancelled-count', getCancelledCount);
router.post('/:id/restore', restoreBackorder);

router.route('/:id')
  .put(updateReservationQuantity)
  .delete(cancelReservation);

router.post('/confirm', confirmBooking);
router.post('/validate-bulk', validateBulk);

export default router;
