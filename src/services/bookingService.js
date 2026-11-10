// src/services/bookingService.js
import { SQLiteBookingRepository } from '../repositories/sqlite.js';
import { generateReferenceCode } from '../domain/ids.js';
import { Booking } from '../../class.js';

export const BookingService = {
    registerBooking(eventId, tierName, attendeeName, quantity, attendeeId) {
        if (quantity <= 0 || quantity > 10) {
            return { success: false, reason: 'VALIDATION' };
        }

        const tier = SQLiteBookingRepository.findTier(eventId, tierName);
        if (!tier) return { success: false, reason: 'TIER_NOT_FOUND' };

        // Execute your tutor's atomic overselling guard statement filter cleanly
        const purchaseSucceeded = SQLiteBookingRepository.updateTicketSalesAtomically(eventId, tierName, quantity);
        
        if (!purchaseSucceeded) {
            return { success: false, reason: 'SOLD_OUT' };
        }

        const refCode = generateReferenceCode();
        const newBooking = new Booking(refCode, eventId, tierName, attendeeName, quantity);
        
        try {
            SQLiteBookingRepository.saveBooking({ referenceCode: refCode, eventId, tierName, attendeeName, quantity }, attendeeId);
            return { success: true, booking: newBooking };
        } catch (error) {
            // Rollback inventory count changes instantly if write processes fail
            SQLiteBookingRepository.releaseTicketSeats(eventId, tierName, quantity);
            return { success: false, reason: 'SOLD_OUT' };
        }
    },

    processPayment(refCode) {
        const booking = SQLiteBookingRepository.findByReference(refCode);
        if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };
        if (booking.status !== 'CONFIRMED') return { success: false, reason: 'INVALID_STATE_CHANGE' };

        SQLiteBookingRepository.updateBookingStatus(refCode, 'PAID');
        booking.status = 'PAID';
        return { success: true, booking };
    },

    cancelBooking(refCode) {
        const booking = SQLiteBookingRepository.findByReference(refCode);
        if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };
        if (booking.status !== 'CONFIRMED') return { success: false, reason: 'INVALID_STATE_CHANGE' };

        SQLiteBookingRepository.releaseTicketSeats(booking.event_id, booking.tier_name, booking.quantity);
        SQLiteBookingRepository.updateBookingStatus(refCode, 'CANCELLED');
        booking.status = 'CANCELLED';
        return { success: true, booking };
    }
};
