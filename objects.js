// objects.js
import { Booking, Queue } from './class.js'; // Look here! We added Queue.
import { mergeSort } from './sorting.js';

// Memory tables using Maps for high performance
export const eventsStorage = new Map();
export const bookingsStorage = new Map();
export const waitlistStorage = new Map(); // EventID_TierName -> Custom Queue instance!

export function generateReferenceCode() {
    return 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export function handleBookingRegistration(eventId, tierName, attendeeName, quantity) {
    const event = eventsStorage.get(eventId);
    if (!event) return { success: false, reason: 'EVENT_NOT_FOUND' };

    const tier = event.tiers.get(tierName);
    if (!tier) return { success: false, reason: 'TIER_NOT_FOUND' };

    // Enforce business rules
    if (quantity <= 0 || quantity > 10) {
        return { success: false, reason: 'VALIDATION' };
    }

    if (!tier.hasAvailableSeats(quantity)) {
        const waitlistKey = `${eventId}_${tierName}`;
        
        // If no waitlist queue exists for this tier yet, initialize a brand new custom Queue
        if (!waitlistStorage.has(waitlistKey)) {
            waitlistStorage.set(waitlistKey, new Queue());
        }
        
        // Use our O(1) enqueue method instead of array .push()
        waitlistStorage.get(waitlistKey).enqueue({ attendeeName, quantity });
        
        return { success: false, reason: 'SOLD_OUT_ADDED_TO_WAITLIST' };
    }

    // Finalize successful purchase transaction
    tier.ticketsSold += quantity;
    const refCode = generateReferenceCode();
    const newBooking = new Booking(refCode, eventId, tierName, attendeeName, quantity);
    
    bookingsStorage.set(refCode, newBooking);
    return { success: true, booking: newBooking };
}

export function searchAndSortEvents(criteria) {
    let events = Array.from(eventsStorage.values());

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
            const tiers = Array.from(e.tiers.values());
            return tiers.some(t => t.priceInCents <= criteria.maxPriceInCents);
        });
    }

    let sortedEvents = events.slice();

    if (criteria.sortBy === 'date') {
        sortedEvents = mergeSort(sortedEvents, (a, b) => new Date(a.date) - new Date(b.date));
    } else if (criteria.sortBy === 'price') {
        sortedEvents = mergeSort(sortedEvents, (a, b) => {
            const minA = Math.min(...Array.from(a.tiers.values()).map(t => t.priceInCents));
            const minB = Math.min(...Array.from(b.tiers.values()).map(t => t.priceInCents));
            return minA - minB;
        });
    }

    return sortedEvents;
}

// Append at the absolute bottom of objects.js

// Process mock payment confirmation (S07)
export function handlePaymentProcessing(bookingRefCode) {
    const booking = bookingsStorage.get(bookingRefCode);
    if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };

    // Prevent paying for already finalized or broken transactions
    if (booking.status !== 'CONFIRMED') {
        return { success: false, reason: 'INVALID_STATE_CHANGE' };
    }

    booking.status = 'PAID'; // State machine transition
    return { success: true, booking };
}

// Cancel an unpaid booking and release seats instantly (S09/S10)
export function handleBookingCancellation(bookingRefCode) {
    const booking = bookingsStorage.get(bookingRefCode);
    if (!booking) return { success: false, reason: 'BOOKING_NOT_FOUND' };

    // Rule boundary: Only unpaid/confirmed bookings can be cancelled at this stage
    if (booking.status !== 'CONFIRMED') {
        return { success: false, reason: 'INVALID_STATE_CHANGE' };
    }

    const event = eventsStorage.get(booking.eventId);
    if (event) {
        const tier = event.tiers.get(booking.tierName);
        if (tier) {
            // Securely release the seats back into the available pool
            tier.ticketsSold -= booking.quantity;
        }
    }

    booking.status = 'CANCELLED'; // State transition
    return { success: true, booking };
}
