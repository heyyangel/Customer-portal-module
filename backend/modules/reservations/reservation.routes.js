import express from 'express';
import {
  getReservations,
  getPendingReservations,
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

router.get('/pending', getPendingReservations);

router.route('/:id')
  .put(updateReservationQuantity)
  .delete(cancelReservation);

router.post('/confirm', confirmBooking);
router.post('/validate-bulk', validateBulk);

export default router;
