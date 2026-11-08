// objects.js
import { DomainError } from './src/domain/errors.js';
import { Booking } from './class.js';
import { mergeSort } from './src/domain/sorting.js';
import { db } from './database.js'; 

export function generateReferenceCode() {
    return 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// S06 & S08: Core ticket booking registration using atomic SQL transactions
export function handleBookingRegistration(eventId, tierName, attendeeName, quantity) {
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

        const insertBooking = db.prepare('INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status) VALUES (?, ?, ?, ?, ?, ?)');
        insertBooking.run(refCode, eventId, tierName, attendeeName, quantity, 'CONFIRMED');

        const newBooking = new Booking(refCode, eventId, tierName, attendeeName, quantity);
        return { success: true, booking: newBooking };

    } catch (error) {
        return { success: false, reason: 'SOLD_OUT' };
    }
}

// S05: Search and sort published events using raw database records
export function searchAndSortEvents(criteria) {
    const selectAllEvents = db.prepare('SELECT * FROM events');
    let events = selectAllEvents.all();

    // Reconstruct structural layout sub-resources using your updated schema properties
    events = events.map(e => {
        const fullEvent = { 
            id: e.id, 
            title: e.title, 
            venue: e.venue,     
            city: e.city, 
            startsAt: e.startsAt, 
            status: e.status, 
            tiers: {} 
        };
        
        const selectTiers = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ?');
        const tiers = selectTiers.all(e.id);
        for (const t of tiers) {
            fullEvent.tiers[t.name] = { 
                name: t.name, 
                priceInCents: t.price_in_cents, 
                capacity: t.capacity, 
                ticketsSold: t.tickets_sold 
            };
        }
        return fullEvent;
    });

    // Apply filtering layers locally
    if (criteria.text) {
        const query = criteria.text.toLowerCase();
        events = events.filter(e => e.title.toLowerCase().includes(query));
    }

    if (criteria.city) {
        const query = criteria.city.toLowerCase();
        events = events.filter(e => e.city.toLowerCase() === query);
    }

    if (criteria.maxPriceInCents) {
        events = events.filter(e => {
            const tiersList = Object.values(e.tiers);
            return tiersList.some(t => t.priceInCents <= criteria.maxPriceInCents);
        });
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

// S07: Process mock payment confirmations
export function handlePaymentProcessing(bookingRefCode) {
    const selectBooking = db.prepare('SELECT * FROM bookings WHERE reference_code = ?');
    const booking = selectBooking.get(bookingRefCode);
    if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };

    if (booking.status !== 'CONFIRMED') {
        return { success: false, reason: 'INVALID_STATE_CHANGE' };
    }

    const updateBookingStatus = db.prepare("UPDATE bookings SET status = 'PAID' WHERE reference_code = ?");
    updateBookingStatus.run(bookingRefCode);

    booking.status = 'PAID';
    return { success: true, booking };
}

// S09 & S10: Cancel bookings and release tickets back to the available pool
export function handleBookingCancellation(bookingRefCode) {
    const selectBooking = db.prepare('SELECT * FROM bookings WHERE reference_code = ?');
    const booking = selectBooking.get(bookingRefCode);
    if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };

    if (booking.status !== 'CONFIRMED') {
        return { success: false, reason: 'INVALID_STATE_CHANGE' };
    }

    const updateTierSeats = db.prepare('UPDATE ticket_tiers SET tickets_sold = tickets_sold - ? WHERE event_id = ? AND name = ?');
    updateTierSeats.run(booking.quantity, booking.event_id, booking.tier_name);

    const updateBookingStatus = db.prepare('UPDATE bookings SET status = "CANCELLED" WHERE reference_code = ?');
    updateBookingStatus.run(bookingRefCode);

    booking.status = 'CANCELLED';
    return { success: true, booking };
}
