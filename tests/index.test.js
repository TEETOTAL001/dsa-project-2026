// tests/index.test.js
import test from 'node:test';
import assert from 'node:assert';
import { Event, TicketTier } from '../class.js';
import { db } from '../database.js';
import { 
    searchAndSortEvents, 
    handlePaymentProcessing, 
    handleBookingCancellation 
} from '../objects.js';

// Setup Mock Data for Testing directly inside SQLite
db.exec('DELETE FROM bookings;');
db.exec('DELETE FROM ticket_tiers;');
db.exec('DELETE FROM events;');

db.prepare("INSERT INTO events (id, title, city, date) VALUES ('E1', 'Afrobeats Fest', 'Lagos', '2026-12-25')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E1', 'Regular', 5000, 100, 0)").run();

db.prepare("INSERT INTO events (id, title, city, date) VALUES ('E2', 'Tech Conference', 'Abuja', '2026-11-10')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E2', 'General', 1500, 50, 0)").run();

db.prepare("INSERT INTO events (id, title, city, date) VALUES ('E3', 'Jazz Night', 'Lagos', '2026-10-05')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E3', 'VIP', 10000, 20, 0)").run();

test('Build 5: Filter events by city correctly', (t) => {
    const results = searchAndSortEvents({ city: 'Lagos' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => e.city === 'Lagos'));
});

test('Build 5: Filter events by text search matching title', (t) => {
    const results = searchAndSortEvents({ text: 'Tech' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, 'Tech Conference');
});

test('Build 5: Filter events within a maximum budget price', (t) => {
    const results = searchAndSortEvents({ maxPriceInCents: 2000 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'E2');
});

test('Build 5: Sort events chronologically by date using custom Merge Sort', (t) => {
    const results = searchAndSortEvents({ sortBy: 'date' });
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].id, 'E3'); // Oct 2026
    assert.strictEqual(results[1].id, 'E2'); // Nov 2026
    assert.strictEqual(results[2].id, 'E1'); // Dec 2026
});

test('Build 5: Booking State Machine - Processing payment successful', (t) => {
    db.prepare("INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status) VALUES ('REF-TEST-PAY', 'E1', 'Regular', 'Tester', 2, 'CONFIRMED')").run();

    const result = handlePaymentProcessing('REF-TEST-PAY');
    assert.strictEqual(result.success, true);
    
    const updatedBooking = db.prepare("SELECT status FROM bookings WHERE reference_code = 'REF-TEST-PAY'").get();
    assert.strictEqual(updatedBooking.status, 'PAID');
});

test('Build 5: Booking State Machine - Refuse paying for an already cancelled booking', (t) => {
    db.prepare("INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status) VALUES ('REF-TEST-DEAD', 'E1', 'Regular', 'Tester', 1, 'CANCELLED')").run();

    const result = handlePaymentProcessing('REF-TEST-DEAD');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'INVALID_STATE_CHANGE');
});
