// objects.js
import { DomainError } from './src/domain/errors.js';
import { Booking } from './class.js';
import { mergeSort } from './src/domain/sorting.js';
import { db } from './database.js'; 
import { hashPassword, generateToken } from './src/domain/auth.js';
import { generateId, generateReferenceCode } from './src/domain/ids.js';

// Build 7: Handle User Sign Up / Registration Process
export function handleUserSignup(email, password, role) {
    if (!email || !password || !role) {
        return { success: false, reason: 'VALIDATION', message: 'Missing core signup inputs' };
    }
    if (!['Attendee', 'Organizer', 'Staff'].includes(role)) {
        return { success: false, reason: 'VALIDATION', message: 'Invalid registration role profile' };
    }

    try {
        const userId = generateId();
        const pwdHash = hashPassword(password);
        
        const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)');
        insertUser.run(userId, email, pwdHash, role);

        return { success: true, user: { id: userId, email, role } };
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return { success: false, reason: 'ALREADY_EXISTS', message: 'Email address already registered' };
        }
        return { success: false, reason: 'DATABASE_ERROR', message: err.message };
    }
}

// Build 7: Handle User Login and Token Dispatching Routine
export function handleUserLogin(email, password) {
    if (!email || !password) {
        return { success: false, reason: 'VALIDATION', message: 'Missing credentials' };
    }

    const selectUser = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = selectUser.get(email);

    if (!user) {
        return { success: false, reason: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    const inputHash = hashPassword(password);
    if (user.password_hash !== inputHash) {
        return { success: false, reason: 'UNAUTHORIZED', message: 'Invalid credentials' };
    }

    // Generate a tamper-proof base64 signature token containing identity attributes
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return { success: true, token, user: { id: user.id, email: user.email, role: user.role } };
}

// S06 & S08: Updated ticket booking registration linking attendee accounts (Build 7)
export function handleBookingRegistration(eventId, tierName, attendeeName, quantity, attendeeId) {
    if (quantity <= 0 || quantity > 10) {
        return { success: false, reason: 'VALIDATION' };
    }

    const selectTier = db.prepare('SELECT tickets_sold, capacity FROM ticket_tiers WHERE event_id = ? AND name = ?');
    const tier = selectTier.get(eventId, tierName);

    if (!tier) return { success: false, reason: 'TIER_NOT_FOUND' };

    if (tier.tickets_sold + quantity > tier.capacity) {
        return { success: false, reason: 'SOLD_OUT' };
    }

    const refCode = generateReferenceCode();

    try {
        const updateTier = db.prepare('UPDATE ticket_tiers SET tickets_sold = tickets_sold + ? WHERE event_id = ? AND name = ?');
        updateTier.run(quantity, eventId, tierName);

        const insertBooking = db.prepare('INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status, attendee_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
        insertBooking.run(refCode, eventId, tierName, attendeeName, quantity, 'CONFIRMED', attendeeId || null);

        const newBooking = new Booking(refCode, eventId, tierName, attendeeName, quantity);
        return { success: true, booking: newBooking };

    } catch (error) {
        return { success: false, reason: 'SOLD_OUT' };
    }
}

// S05: Search and sort events (Returns only 'published' events to general visitors)
export function searchAndSortEvents(criteria) {
    const selectAllEvents = db.prepare("SELECT * FROM events WHERE status = 'published'");
    let events = selectAllEvents.all();

    events = events.map(e => {
        const fullEvent = { id: e.id, title: e.title, venue: e.venue, city: e.city, startsAt: e.startsAt, status: e.status, tiers: {} };
        const selectTiers = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?');
        const tiers = selectTiers.all(e.id);
        for (const t of tiers) {
            fullEvent.tiers[t.name] = { name: t.name, priceInCents: t.price_in_cents, capacity: t.capacity, ticketsSold: t.tickets_sold };
        }
        return fullEvent;
    });

    if (criteria.text) {
        const query = criteria.text.toLowerCase();
        events = events.filter(e => e.title.toLowerCase().includes(query));
    }
    if (criteria.city) {
        const query = criteria.city.toLowerCase();
        events = events.filter(e => e.city.toLowerCase() === query);
    }
    if (criteria.maxPriceInCents) {
        events = events.filter(e => Object.values(e.tiers).some(t => t.priceInCents <= criteria.maxPriceInCents));
    }

    let sortedEvents = events.slice();
    if (criteria.sortBy === 'date') {
        sortedEvents = mergeSort(sortedEvents, (a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    } else if (criteria.sortBy === 'price') {
        sortedEvents = mergeSort(sortedEvents, (a, b) => {
            const minA = Math.min(...Object.values(a.tiers).map(t => t.priceInCents));
            const minB = Math.min(...Object.values(b.tiers).map(t => t.priceInCents));
            return minA - minB;
        });
    }
    return sortedEvents;
}

// Build 7 Role Privacy Rule: Pull bookings belonging to the requesting Attendee only
export function fetchAttendeeBookings(attendeeId) {
    const selectBookings = db.prepare('SELECT b.*, e.title, e.startsAt, e.venue FROM bookings b JOIN events e ON b.event_id = e.id WHERE b.attendee_id = ?');
    return selectBookings.all(attendeeId);
}

// Build 7 Role Privacy Rule: Pull events belonging to the requesting Organizer only
export function fetchOrganizerDashboard(organizerId) {
    const selectEvents = db.prepare('SELECT * FROM events WHERE owner_id = ?');
    return selectEvents.all(organizerId);
}

// Process mock payments
export function handlePaymentProcessing(bookingRefCode) {
    const selectBooking = db.prepare('SELECT * FROM bookings WHERE reference_code = ?');
    const booking = selectBooking.get(bookingRefCode);
    if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };
    if (booking.status !== 'CONFIRMED') return { success: false, reason: 'INVALID_STATE_CHANGE' };

    db.prepare("UPDATE bookings SET status = 'PAID' WHERE reference_code = ?").run(bookingRefCode);
    booking.status = 'PAID';
    return { success: true, booking };
}

// Cancel pending ticket allocations
export function handleBookingCancellation(bookingRefCode) {
    const selectBooking = db.prepare('SELECT * FROM bookings WHERE reference_code = ?');
    const booking = selectBooking.get(bookingRefCode);
    if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };
    if (booking.status !== 'CONFIRMED') return { success: false, reason: 'INVALID_STATE_CHANGE' };

    db.prepare('UPDATE ticket_tiers SET tickets_sold = tickets_sold - ? WHERE event_id = ? AND name = ?').run(booking.quantity, booking.event_id, booking.tier_name);
    db.prepare('UPDATE bookings SET status = "CANCELLED" WHERE reference_code = ?').run(bookingRefCode);
    booking.status = 'CANCELLED';
    return { success: true, booking };
}
