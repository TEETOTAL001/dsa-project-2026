// src/services/checkInService.js
import { SQLiteBookingRepository } from '../repositories/sqlite.js';
import { CryptographicTicketSigner } from '../domain/qr.js';
import { db } from '../db/connection.js';

export const CheckInService = {
    // Build 9: Decodes signature packets and updates entry parameters securely
    executeStaffCheckIn(scannedPayload) {
        // 1. Verify if the cryptographic signature matches our private secret token
        const verification = CryptographicTicketSigner.verifyScannedPayload(scannedPayload);
        if (!verification.isValid) {
            return { success: false, reason: 'FORGED', message: '❌ Access Denied: Ticket signature has been forged or altered!' };
        }

        // 2. Query the raw database record out of disk columns
        const booking = SQLiteBookingRepository.findByReference(verification.referenceCode);
        if (!booking) {
            return { success: false, reason: 'NOT_FOUND', message: '❌ Access Denied: Booking reference token does not exist.' };
        }

        // 3. Prevent un-paid or draft allocations from slipping inside gate boundaries
        if (booking.status !== 'PAID') {
            return { success: false, reason: 'UNPAID', message: '❌ Access Denied: This reservation hasn\'t been paid for!' };
        }

        // 4. Protection Guard Rule: Reject repeated scans instantly
        if (booking.checked_in === 1) {
            return { success: false, reason: 'DUPLICATE', message: '⚠️ Access Denied: Ticket already scanned! Repeated admission rejected.' };
        }

        // 5. Mark the row asset as checked-in successfully
        db.prepare('UPDATE bookings SET checked_in = 1 WHERE reference_code = ?').run(verification.referenceCode);
        
        return { 
            success: true, 
            message: `✅ Admission Approved! Welcome, ${booking.attendee_name}. Enjoy the event!`,
            booking: { referenceCode: booking.reference_code, attendeeName: booking.attendee_name, tierName: booking.tier_name }
        };
    }
};
