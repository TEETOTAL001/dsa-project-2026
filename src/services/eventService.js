// src/services/eventService.js
import { SQLiteEventRepository } from '../repositories/sqlite.js';
import { mergeSort } from '../domain/sorting.js';

export const EventService = {
    searchAndSort(criteria) {
        let events = SQLiteEventRepository.findAllPublished();

        events = events.map(e => {
            const fullEvent = { id: e.id, title: e.title, venue: e.venue, city: e.city, startsAt: e.startsAt, status: e.status, tiers: {} };
            const tiers = SQLiteEventRepository.findTiersByEventId(e.id);
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
};
