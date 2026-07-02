import Reservation from '../../models/Reservation.js';
import Product from '../../models/Product.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';
import { io } from '../../server.js';
import { sendEmail } from '../../utils/mailer.js';

// Helper to log audit events
const logSystemEvent = async (action, remarks) => {
  try {
    await AuditLog.create({
      action: action,
      method: 'SYSTEM_JOB',
      endpoint: 'N/A',
      ipAddress: '127.0.0.1',
      userAgent: 'ERP BACKGROUND JOB',
      remarks: remarks
    });
  } catch (error) {
    console.error('[System Audit Log Error]', error);
  }
};

// Helper to create notifications
const sendSystemNotification = (userId, title, message) => {
  Notification.create({
    user: userId,
    title,
    message,
    type: 'reservation'
  }).then(notif => {
    io.emit('notification-received', notif);
  }).catch(err => console.error('[Notification error]', err));
};

export const runReservationExpiryChecks = async () => {
  console.log('[Job] Starting Daily Reservation Lifecycle checks...');
  try {
    const now = new Date();
    const activeReservations = await Reservation.find({ status: 'Reserved' }).populate('customerId');

    for (let reservation of activeReservations) {
      const customer = reservation.customerId;
      if (!customer) continue;

      const timeDiff = now.getTime() - reservation.reservationDate.getTime();
      const daysElapsed = timeDiff / (24 * 60 * 60 * 1000);

      // 1. Expiration (Days elapsed >= 7 or now >= expiryDate)
      if (now >= reservation.expiryDate) {
        // Expire reservation
        const product = await Product.findById(reservation.productId);
        if (product) {
          product.availableStock += reservation.quantity;
          product.reservedStock -= reservation.quantity;
          await product.save();
        }

        reservation.status = 'Expired';
        reservation.expiredAt = now;
        await reservation.save();

        await logSystemEvent('Reservation Expired', `Reservation ${reservation.reservationId} for ${reservation.skuCode} expired. Stock released.`);
        sendSystemNotification(customer._id, 'Reservation Expired', `Your reservation ${reservation.reservationId} has expired and stock was released.`);
        
        await sendEmail(
          customer.email,
          'Booking Reservation Expired',
          `Your reservation has expired because it was not confirmed within 7 days.<br/>
           The reserved products have been released back into inventory.<br/>
           You may create a new reservation at any time.`
        );
        continue;
      }

      // 2. Day 7 Final Reminder (Days elapsed >= 6, remaining days <= 1, reminder not sent)
      if (daysElapsed >= 6 && reservation.lastReminderSent !== 'day7') {
        reservation.lastReminderSent = 'day7';
        await reservation.save();

        await logSystemEvent('Final Reminder Sent (Day 7)', `Sent final reminder for reservation ${reservation.reservationId}`);
        sendSystemNotification(customer._id, 'Reservation Expiring Soon', `Today is the final day to confirm your reservation ${reservation.reservationId}.`);

        await sendEmail(
          customer.email,
          'Final Booking Reminder',
          `Today is the final day to confirm your reservation.<br/>
           If no action is taken, the reservation will expire automatically.`
        );
        continue;
      }

      // 3. Day 5 Reminder (Days elapsed >= 5, remaining days <= 2, reminder not sent)
      if (daysElapsed >= 5 && reservation.lastReminderSent !== 'day5' && reservation.lastReminderSent !== 'day7') {
        reservation.lastReminderSent = 'day5';
        await reservation.save();

        await logSystemEvent('Reminder Sent (Day 5)', `Sent day 5 reminder for reservation ${reservation.reservationId}`);
        sendSystemNotification(customer._id, 'Reservation Expiring Soon', `Your reservation ${reservation.reservationId} will expire in 2 days.`);

        await sendEmail(
          customer.email,
          'Booking Reservation Reminder',
          `Your reserved products will expire in 2 days.<br/>
           Please confirm your booking before the reservation expires.`
        );
      }
    }
    console.log('[Job] Completed Daily Reservation Lifecycle checks.');
  } catch (error) {
    console.error('[Job Error] Failed to run reservation checks:', error);
  }
};
