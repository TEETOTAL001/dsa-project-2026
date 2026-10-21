// index.test.js
import test from 'node:test';
import assert from 'node:assert';
import { Event, TicketTier } from './class.js';
import { eventsStorage, searchAndSortEvents } from './objects.js';

// Setup Mock Data for Testing
const event1 = new Event('E1', 'Afrobeats Fest', 'Lagos', '2026-12-25');
event1.addTier(new TicketTier('Regular', 5000, 100)); // 5000 cents

const event2 = new Event('E2', 'Tech Conference', 'Abuja', '2026-11-10');
event2.addTier(new TicketTier('General', 1500, 50));  // 1500 cents

const event3 = new Event('E3', 'Jazz Night', 'Lagos', '2026-10-05');
event3.addTier(new TicketTier('VIP', 10000, 20));     // 10000 cents

// Save them into memory storage
eventsStorage.set(event1.id, event1);
eventsStorage.set(event2.id, event2);
eventsStorage.set(event3.id, event3);

test('Build 2: Filter events by city correctly', (t) => {
    const results = searchAndSortEvents({ city: 'Lagos' });
    assert.strictEqual(results.length, 2);
    assert.ok(results.every(e => e.city === 'Lagos'));
});

test('Build 2: Filter events by text search matching title', (t) => {
    const results = searchAndSortEvents({ text: 'Tech' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, 'Tech Conference');
});

test('Build 2: Filter events within a maximum budget price', (t) => {
    const results = searchAndSortEvents({ maxPriceInCents: 2000 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'E2'); // Only Tech Conference is under 2000 cents
});

test('Build 2: Sort events chronologically by date using custom Merge Sort', (t) => {
    const results = searchAndSortEvents({ sortBy: 'date' });
    
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].id, 'E3'); // Oct 2026
    assert.strictEqual(results[1].id, 'E2'); // Nov 2026
    assert.strictEqual(results[2].id, 'E1'); // Dec 2026
});

test('Build 2: Searching and sorting must NEVER mutate original storage list', (t) => {
    const initialCount = eventsStorage.size;
    searchAndSortEvents({ sortBy: 'price', city: 'Lagos' });
    
    // Check that original storage hasn't been modified or rearranged
    assert.strictEqual(eventsStorage.size, initialCount);
    assert.ok(eventsStorage.has('E1'));
});
