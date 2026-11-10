// src/repositories/sqlite.js
import { db } from '../db/connection.js';

export const SQLiteUserRepository = {
    save(user) {
        const insert = db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)');
        insert.run(user.id, user.email, user.passwordHash, user.role);
        return user;
    },

    findByEmail(email) {
        const query = db.prepare('SELECT * FROM users WHERE email = ?');
        const record = query.get(email);
        if (!record) return null;
        return {
            id: record.id,
            email: record.email,
            passwordHash: record.password_hash,
            role: record.role
        };
    }
};

export const SQLiteEventRepository = {
    save(event, ownerId) {
        const insert = db.prepare('INSERT INTO events (id, title, venue, city, startsAt, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insert.run(event.id, event.title, event.venue, event.city, event.startsAt, event.status, ownerId);
        return event;
    },

    saveTier(eventId, tier) {
        const insert = db.prepare('INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES (?, ?, ?, ?, ?)');
        insert.run(eventId, tier.name, tier.priceInCents, tier.capacity, tier.ticketsSold || 0);
    },

    findAllPublished() {
        return db.prepare("SELECT * FROM events WHERE status = 'published'").all();
    },

    findTiersByEventId(eventId) {
        return db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?').all();
    },

    findByOrganizerId(organizerId) {
        return db.prepare('SELECT * FROM events WHERE owner_id = ?').all();
    }
};

export const SQLiteBookingRepository = {
    findTier(eventId, tierName) {
        return db.prepare('SELECT tickets_sold, capacity FROM ticket_tiers WHERE event_id = ? AND name = ?').get(eventId, tierName);
    },

    // Build 8: The native overselling guard loop condition query
    updateTicketSalesAtomically(eventId, tierName, quantity) {
        const update = db.prepare(`
            UPDATE ticket_tiers 
            SET tickets_sold = tickets_sold + ? 
            WHERE event_id = ? AND name = ? AND tickets_sold + ? <= capacity
        `);
        const result = update.run(quantity, eventId, tierName, quantity);
        return result.changes > 0; // Returns true ONLY if capacity checks passed successfully
    },

    saveBooking(booking, attendeeId) {
        const insert = db.prepare('INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status, attendee_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insert.run(booking.referenceCode, booking.eventId, booking.tierName, booking.attendeeName, booking.quantity, 'CONFIRMED', attendeeId);
    },

    findByAttendeeId(attendeeId) {
        const query = db.prepare(`
            SELECT b.*, e.title, e.startsAt, e.venue 
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            WHERE b.attendee_id = ?
        `);
        return query.all(attendeeId);
    },

    findByReference(refCode) {
        return db.prepare('SELECT * FROM bookings WHERE reference_code = ?').get(refCode);
    },

    updateBookingStatus(refCode, status) {
        db.prepare('UPDATE bookings SET status = ? WHERE reference_code = ?').run(status, refCode);
    },

    releaseTicketSeats(eventId, tierName, quantity) {
        db.prepare('UPDATE ticket_tiers SET tickets_sold = tickets_sold - ? WHERE event_id = ? AND name = ?').run(quantity, eventId, tierName);
    }
};
