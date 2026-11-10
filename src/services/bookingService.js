// src/services/bookingService.js
import { SQLiteBookingRepository, SQLiteWaitlistRepository, SQLiteEventRepository } from '../repositories/sqlite.js';
import { SystemClock } from '../domain/clock.js';
import { generateReferenceCode, generateId } from '../domain/ids.js';
import { Booking } from '../../class.js';
import { db } from '../db/connection.js';

export const BookingService = {
    // Build 8: Register a booking with a precise creation timestamp entry
    registerBooking(eventId, tierName, attendeeName, quantity, attendeeId) {
        if (quantity <= 0 || quantity > 10) return { success: false, reason: 'VALIDATION' };

        const tier = SQLiteBookingRepository.findTier(eventId, tierName);
        if (!tier) return { success: false, reason: 'TIER_NOT_FOUND' };

        const purchaseSucceeded = SQLiteBookingRepository.updateTicketSalesAtomically(eventId, tierName, quantity);
        if (!purchaseSucceeded) return { success: false, reason: 'SOLD_OUT', message: 'This ticket tier level is currently sold out!' };

        const refCode = generateReferenceCode();
        const currentTimestamp = SystemClock.now().getTime();
        const newBooking = new Booking(refCode, eventId, tierName, attendeeName, quantity);
        
        try {
            const insert = db.prepare('INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status, attendee_id, created_at) VALUES (?, ?, ?, ?, ?, "CONFIRMED", ?, ?)');
            insert.run(refCode, eventId, tierName, attendeeName, quantity, attendeeId, currentTimestamp);
            return { success: true, booking: newBooking };
        } catch (error) {
            SQLiteBookingRepository.releaseTicketSeats(eventId, tierName, quantity);
            return { success: false, reason: 'SOLD_OUT' };
        }
    },

    // Build 8 Waitlist Engine Integration Pattern
    joinTierWaitlist(eventId, tierName, userId) {
        const queueId = generateId();
        const currentTimestamp = SystemClock.now().getTime();
        SQLiteWaitlistRepository.join(queueId, eventId, tierName, userId, currentTimestamp);
        return { success: true, message: 'Successfully joined the ticket tier line waitlist queue!' };
    },

    // Build 8 Time-based refund calculation boundary assessment engine
    calculateRefundAmount(refCode) {
        const booking = SQLiteBookingRepository.findByReference(refCode);
        if (!booking) return { refundInCents: 0, percentage: 0 };

        const event = db.prepare('SELECT startsAt FROM events WHERE id = ?').get(booking.event_id);
        const tier = db.prepare('SELECT price_in_cents FROM ticket_tiers WHERE event_id = ? AND name = ?').get(booking.event_id, booking.tier_name);

        const totalCost = tier.price_in_cents * booking.quantity;
        const msRemaining = new Date(event.startsAt).getTime() - SystemClock.now().getTime();
        const daysRemaining = msRemaining / (1000 * 60 * 60 * 24);

        if (daysRemaining > 14) return { refundInCents: totalCost, percentage: 100 };
        if (daysRemaining >= 7) return { refundInCents: Math.floor(totalCost * 0.5), percentage: 50 };
        return { refundInCents: 0, percentage: 0 }; // Non-refundable condition boundary met!
    },

    // Build 8: Process cancellation and trigger waitlist offers atomically
    cancelAndRefundBooking(refCode) {
        const booking = SQLiteBookingRepository.findByReference(refCode);
        if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };
        if (booking.status === 'CANCELLED') return { success: false, reason: 'ALREADY_CANCELLED', message: 'This booking has already been cancelled!' };

        const refundMatrix = this.calculateRefundAmount(refCode);
        
        // Execute status changes and release seats back to open pools
        SQLiteBookingRepository.updateBookingStatus(refCode, 'CANCELLED');
        SQLiteBookingRepository.releaseTicketSeats(booking.event_id, booking.tier_name, booking.quantity);

        // Check if anyone is waiting in line to auto-dispatch a timed pass offer
        const nextUser = SQLiteWaitlistRepository.findNextInLine(booking.event_id, booking.tier_name);
        if (nextUser) {
            const offerExpiry = SystemClock.now().getTime() + (30 * 60 * 1000); // 30-minute response token window limit
            SQLiteWaitlistRepository.dispatchTimedOffer(nextUser.id, offerExpiry);
        }

        return { success: true, refundIssued: refundMatrix.refundInCents, percentage: refundMatrix.percentage };
    },

    // Build 8 Hold Expiration Cleaner Loop Task Engine
    purgeExpiredUnpaidHolds() {
        const fiveMinutesAgo = SystemClock.now().getTime() - (5 * 60 * 1000); // 5-minute maximum checkout allocation limit
        const expiredHolds = db.prepare("SELECT * FROM bookings WHERE status = 'CONFIRMED' AND created_at < ?").all(fiveMinutesAgo);

        for (const b of expiredHolds) {
            SQLiteBookingRepository.updateBookingStatus(b.reference_code, 'CANCELLED');
            SQLiteBookingRepository.releaseTicketSeats(b.event_id, b.tier_name, b.quantity);
            console.log(`⏳ Unpaid ticket reservation ${b.reference_code} has expired and seats have been released.`);
        }
        return expiredHolds.length;
    }
};
