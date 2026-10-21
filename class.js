// class.js

export class TicketTier {
    constructor(name, priceInCents, capacity) {
        this.name = name;
        this.priceInCents = priceInCents; // Stored as integers (e.g., 5000 cents = $50)
        this.capacity = capacity;
        this.ticketsSold = 0;
    }

    hasAvailableSeats(quantity) {
        return (this.ticketsSold + quantity) <= this.capacity;
    }
}

export class Event {
    constructor(id, title, city, date) {
        this.id = id;
        this.title = title;
        this.city = city;
        this.date = date;
        this.tiers = new Map(); // Using Map for efficient sub-resource lookup
    }

    addTier(tier) {
        this.tiers.set(tier.name, tier);
    }
}

export class Booking {
    constructor(referenceCode, eventId, tierName, attendeeName, quantity) {
        this.referenceCode = referenceCode;
        this.eventId = eventId;
        this.tierName = tierName;
        this.attendeeName = attendeeName;
        this.quantity = quantity;
        this.status = 'CONFIRMED';
    }
}
