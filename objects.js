// objects.js
import { Booking } from './class.js';
import { mergeSort } from './sorting.js'; // Look here! All imports are safely at the top now.

// Memory tables using Maps for high performance
export const eventsStorage = new Map();
export const bookingsStorage = new Map();
export const waitlistStorage = new Map(); // EventID_TierName -> Array of names

export function generateReferenceCode() {
    return 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export function handleBookingRegistration(eventId, tierName, attendeeName, quantity) {
    const event = eventsStorage.get(eventId);
    if (!event) return { success: false, reason: 'EVENT_NOT_FOUND' };

    const tier = event.tiers.get(tierName);
    if (!tier) return { success: false, reason: 'TIER_NOT_FOUND' };

    // Enforce business rules from user-stories.md
    if (quantity <= 0 || quantity > 10) {
        return { success: false, reason: 'VALIDATION' };
    }

    if (!tier.hasAvailableSeats(quantity)) {
        // Automatically track waitlist placement
        const waitlistKey = `${eventId}_${tierName}`;
        if (!waitlistStorage.has(waitlistKey)) {
            waitlistStorage.set(waitlistKey, []);
        }
        waitlistStorage.get(waitlistKey).push({ attendeeName, quantity });
        
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
    // Convert our Map storage values into a standard Array to filter them
    let events = Array.from(eventsStorage.values());

    // 1. Filter by Text Search (matches title)
    if (criteria.text) {
        const query = criteria.text.toLowerCase();
        events = events.filter(e => e.title.toLowerCase().includes(query));
    }

    // 2. Filter by City
    if (criteria.city) {
        const query = criteria.city.toLowerCase();
        events = events.filter(e => e.city.toLowerCase() === query);
    }

    // 3. Filter by Max Price (checks if any tier is under the budget)
    if (criteria.maxPriceInCents) {
        events = events.filter(e => {
            const tiers = Array.from(e.tiers.values());
            return tiers.some(t => t.priceInCents <= criteria.maxPriceInCents);
        });
    }

    // 4. SORT implementation using our custom Merge Sort (Never mutates original list)
    let sortedEvents = events.slice(); // Create a shallow copy to protect the original array

    if (criteria.sortBy === 'date') {
        sortedEvents = mergeSort(sortedEvents, (a, b) => new Date(a.date) - new Date(b.date));
    } else if (criteria.sortBy === 'price') {
        sortedEvents = mergeSort(sortedEvents, (a, b) => {
            // Compare lowest tier price of event A vs event B
            const minA = Math.min(...Array.from(a.tiers.values()).map(t => t.priceInCents));
            const minB = Math.min(...Array.from(b.tiers.values()).map(t => t.priceInCents));
            return minA - minB;
        });
    }

    return sortedEvents;
}
