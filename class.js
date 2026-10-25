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


// Add this at the absolute bottom of class.js

class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

export class Queue {
    #head = null;
    #tail = null;
    #size = 0;

    // Add a person to the back of the waitlist in O(1) time
    enqueue(value) {
        const newNode = new Node(value);
        if (this.#tail === null) {
            this.#head = newNode;
            this.#tail = newNode;
        } else {
            this.#tail.next = newNode;
            this.#tail = newNode;
        }
        this.#size++;
    }

    // Remove the first person from the front of the waitlist in O(1) time
    dequeue() {
        if (this.#head === null) return null;
        
        const removedValue = this.#head.value;
        this.#head = this.#head.next;
        
        if (this.#head === null) {
            this.#tail = null;
        }
        this.#size--;
        return removedValue;
    }

    get size() {
        return this.#size;
    }

    // Helper to turn the queue into a regular array for logging/printing
    toArray() {
        const result = [];
        let current = this.#head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }
}
