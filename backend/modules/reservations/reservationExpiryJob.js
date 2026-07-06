import Reservation from '../../models/Reservation.js';
import AuditLog from '../../models/AuditLog.js';
import { sendEmail } from '../../utils/mailer.js';
import { notifyUser } from '../../utils/notify.js';

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

// Deliver a reminder/expiry notification to the customer's own room.
const sendSystemNotification = (userId, title, message) => {
  notifyUser(userId, { title, message, type: 'reservation' });
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

      // 1. Auto-cancel after 7 days (now >= expiryDate).
      // Note: stock is NOT deducted when an item is added to the selection list
      // (only at confirmation), so there is nothing to release here — we simply
      // drop the un-confirmed item from the list and notify the customer.
      if (now >= reservation.expiryDate) {
        reservation.status = 'Expired';
        reservation.expiredAt = now;
        await reservation.save();

        await logSystemEvent('Reservation Expired', `Reservation ${reservation.reservationId} for ${reservation.skuCode} auto-cancelled after 7 days (not confirmed).`);
        sendSystemNotification(customer._id, 'Booking Auto-Cancelled', `Your booking ${reservation.reservationId} (${reservation.skuCode}) was removed from your selection list after 7 days without confirmation.`);

        await sendEmail(
          customer.email,
          'Booking Auto-Cancelled',
          `Your booking <b>${reservation.reservationId}</b> for <b>${reservation.skuCode}</b> (${reservation.quantity} units) was
           automatically cancelled and removed from your selection list because it was not confirmed within 7 days.<br/><br/>
           You can add the item to a new booking at any time.`
        );
        continue;
      }

      const itemLine = `<b>${reservation.reservationId}</b> — <b>${reservation.skuCode}</b> (${reservation.quantity} units)`;

      // 2. Final reminder — fires the day before the 7-day auto-cancel so it always
      //    lands before the item is dropped (daily cron + 7-day expiry window).
      if (daysElapsed >= 6 && reservation.lastReminderSent !== 'day7') {
        reservation.lastReminderSent = 'day7';
        await reservation.save();

        await logSystemEvent('Final Reminder Sent', `Sent final reminder for reservation ${reservation.reservationId}`);
        sendSystemNotification(customer._id, 'Booking Expiring Soon', `Final reminder: confirm booking ${reservation.reservationId} (${reservation.skuCode}) before it is auto-cancelled.`);

        await sendEmail(
          customer.email,
          'Final Reminder — Booking Expires Tomorrow',
          `This is the final reminder to confirm your booking:<br/><br/>
           ${itemLine}<br/><br/>
           It is still in your selection list and will be <b>automatically cancelled</b> if not confirmed.
           Please confirm it before then to place your order.`
        );
        continue;
      }

      // 3. Day 5 reminder — first nudge, ~2 days before auto-cancel.
      if (daysElapsed >= 5 && reservation.lastReminderSent !== 'day5' && reservation.lastReminderSent !== 'day7') {
        reservation.lastReminderSent = 'day5';
        await reservation.save();

        await logSystemEvent('Reminder Sent (Day 5)', `Sent day 5 reminder for reservation ${reservation.reservationId}`);
        sendSystemNotification(customer._id, 'Booking Awaiting Confirmation', `Booking ${reservation.reservationId} (${reservation.skuCode}) is still in your selection list.`);

        await sendEmail(
          customer.email,
          'Reminder — Booking Awaiting Confirmation',
          `You have a booking still in your selection list that has not been confirmed:<br/><br/>
           ${itemLine}<br/><br/>
           Please confirm it soon — un-confirmed bookings are automatically cancelled after 7 days.`
        );
      }
    }
    console.log('[Job] Completed Daily Reservation Lifecycle checks.');
  } catch (error) {
    console.error('[Job Error] Failed to run reservation checks:', error);
  }
};
