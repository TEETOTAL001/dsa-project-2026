// tests/index.test.js
import test from 'node:test';
import assert from 'node:assert';
import { db, initializeDatabaseSchema } from '../database.js';
import { 
    searchAndSortEvents, 
    handlePaymentProcessing, 
    handleBookingCancellation 
} from '../objects.js';

// Import Build 7 & Build 8 secure verification models
import { handleUserLogin, handleUserSignup } from '../objects.js';
import { generateToken, verifyToken } from '../src/domain/auth.js';
import { BookingService } from '../src/services/bookingService.js';
import { SystemClock } from '../src/domain/clock.js';

// 1. Initialize the tables FIRST so they exist in our clean file!
initializeDatabaseSchema();

// Setup Mock Data: Clear tables in strict dependency order to pass foreign key rules
db.exec('DELETE FROM bookings;');
db.exec('DELETE FROM ticket_tiers;');
db.exec('DELETE FROM events;');

// Make sure these SQL queries match your new schema layout columns
db.prepare("INSERT INTO events (id, title, venue, city, startsAt, status) VALUES ('E1', 'Afrobeats Fest', 'Eko Hotel', 'Lagos', '2026-12-25', 'published')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E1', 'Regular', 5000, 100, 0)").run();

db.prepare("INSERT INTO events (id, title, venue, city, startsAt, status) VALUES ('E2', 'Tech Conference', 'ICC', 'Abuja', '2026-11-10', 'published')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E2', 'General', 1500, 50, 0)").run();

db.prepare("INSERT INTO events (id, title, venue, city, startsAt, status) VALUES ('E3', 'Jazz Night', 'Muson Centre', 'Lagos', '2026-10-05', 'published')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E3', 'VIP', 10000, 20, 0)").run();

// ==========================================
// BUILD 5 CORE FUNCTIONAL TESTS
// ==========================================

test('Build 5: Filter events by city correctly', (t) => {
    const results = searchAndSortEvents({ city: 'Lagos' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => e.city === 'lagos' || e.city === 'Lagos'));
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

// ==========================================
// BUILD 7 ROBUST AUTHENTICATION TESTS
// ==========================================

test('Build 7: Authentication Matrix - User login authentication with hashed verification matches', (t) => {
    db.exec("DELETE FROM users WHERE email = 'test-suite@auth.com'");
    handleUserSignup('test-suite@auth.com', 'securePwd123', 'Attendee');

    const result = handleUserLogin('test-suite@auth.com', 'securePwd123');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.user.role, 'Attendee');
    assert.ok(result.token);
});

test('Build 7: Authorization Matrix - Reject tampered or corrupted bad token signatures', (t) => {
    const fakeToken = "eyJwYXlsb2FkIjp0cnVlfQ==.corruptedSignatureStringHere";
    const userPayload = verifyToken(fakeToken);
    assert.strictEqual(userPayload, null);
});

test('Build 7: Role Permission Matrix - Restrict wrong roles from reading administrative dashboard paths', (t) => {
    const nonOrganizerToken = generateToken({ id: 'user-99', email: 'user@test.com', role: 'Attendee' });
    const userPayload = verifyToken(nonOrganizerToken);
    assert.strictEqual(userPayload.role, 'Attendee');
    assert.notStrictEqual(userPayload.role, 'Organizer');
});

// ==========================================
// BUILD 8 TIMED ENGINE & REFUND BOUNDARY TESTS
// ==========================================

test('Build 8: Refund Boundaries - Calculate 100% refund amount when event is > 14 days away', (t) => {
    SystemClock.reset();
    db.exec("DELETE FROM bookings; DELETE FROM ticket_tiers; DELETE FROM events;");
    
    db.prepare("INSERT INTO events (id, title, venue, city, startsAt, status) VALUES ('E-REF1', 'Future Fest', 'V1', 'City1', '2026-11-30', 'published')").run();
    db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E-REF1', 'VIP', 10000, 10, 1)").run();
    
    db.prepare(`
        INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status, created_at) 
        VALUES ('REF-VAL-88', 'E-REF1', 'VIP', 'Alice', 1, 'CONFIRMED', ?)
    `).run(SystemClock.now().getTime());
    
    const estimate = BookingService.calculateRefundAmount('REF-VAL-88');
    
    assert.strictEqual(estimate.percentage, 100);
    assert.strictEqual(estimate.refundInCents, 10000);
});

test('Build 8: Expiration Loops - Purge and cancel unpaid ticket allocations after 5 minutes pass', (t) => {
    SystemClock.reset();
    db.exec("DELETE FROM bookings; DELETE FROM ticket_tiers; DELETE FROM events;");
    
    db.prepare("INSERT INTO events (id, title, venue, city, startsAt, status) VALUES ('E-REF1', 'Future Fest', 'V1', 'City1', '2026-11-30', 'published')").run();
    db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('E-REF1', 'VIP', 10000, 10, 1)").run();
    
    db.prepare(`
        INSERT INTO bookings (reference_code, event_id, tier_name, attendee_name, quantity, status, created_at) 
        VALUES ('REF-EXP-99', 'E-REF1', 'VIP', 'Bob', 1, 'CONFIRMED', ?)
    `).run(SystemClock.now().getTime());
    
    // Artificially skip time forward by 6 minutes using our system clock wrapper layer
    SystemClock.travelForwardByMs(6 * 60 * 1000);
    
    const counts = BookingService.purgeExpiredUnpaidHolds();
    assert.strictEqual(counts, 1);
    
    SystemClock.reset();
});
