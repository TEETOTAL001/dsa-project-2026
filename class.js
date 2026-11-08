// class.js
import { DomainError } from './src/domain/errors.js';

export class TicketTier {
    constructor(name, priceInCents, capacity) {
        this.name = name;
        this.priceInCents = priceInCents;
        this.capacity = capacity;
        this.ticketsSold = 0;
    }

    hasAvailableSeats(quantity) {
        return this.ticketsSold + quantity <= this.capacity;
    }
}

export class Event {
    constructor(id, title, venue, city, startsAt) {
        this.id = id;
        this.title = title;
        this.venue = venue;
        this.city = city;
        this.startsAt = startsAt;
        this.status = "draft";
        this.tiers = new Map();
    }

    addTier(tier) {
        this.tiers.set(tier.name, tier);
    }

    get tierCount() {
        return this.tiers.size;
    }
}

export class Booking {
    constructor(referenceCode, eventId, tierName, attendeeName, quantity) {
        this.referenceCode = referenceCode;
        this.eventId = eventId;
        this.tierName = tierName;
        this.attendeeName = attendeeName;
        this.quantity = quantity;
        this.status = "CONFIRMED";
    }
}
