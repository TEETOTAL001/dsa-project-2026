// simulate.js
import { db, initializeDatabaseSchema } from './database.js';
import { handleBookingRegistration } from './objects.js';

// 1. Reset and initialize a clean database environment
db.exec('DROP TABLE IF EXISTS bookings;');
db.exec('DROP TABLE IF EXISTS ticket_tiers;');
db.exec('DROP TABLE IF EXISTS events;');
initializeDatabaseSchema();

// 2. Insert 1 mock event and 1 ticket tier with EXACTLY 1 ticket available
db.prepare("INSERT INTO events (id, title, city, date) VALUES ('EV-RACE', 'Race Concert', 'Lagos', '2026-12-01')").run();
db.prepare("INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES ('EV-RACE', 'VIP', 5000, 1, 0)").run();

console.log("=== Starting Build 5: 50-Person Concurrent Booking Race ===");
console.log("Initial State: 1 ticket left in VIP tier.");

const totalAttendees = 50;
const promises = [];

// 3. Fire 50 booking requests rapidly at the exact same moment
for (let i = 1; i <= totalAttendees; i++) {
    promises.push(
        new Promise((resolve) => {
            // Simulate instant parallel server processing
            setTimeout(() => {
                const result = handleBookingRegistration('EV-RACE', 'VIP', `Attendee ${i}`, 1);
                resolve(result);
            }, 0);
        })
    );
}

// 4. Evaluate the results of the race
Promise.all(promises).then((results) => {
    let successCount = 0;
    let soldOutCount = 0;

    results.forEach((res) => {
        if (res.success) successCount++;
        if (!res.success && res.reason === 'SOLD_OUT') soldOutCount++;
    });

    console.log("\n=== Race Simulation Results ===");
    console.log(`Successful Bookings: ${successCount} (Expected: 1)`);
    console.log(`Rejected (SOLD_OUT) Bookings: ${soldOutCount} (Expected: 49)`);

    // Fetch the final database state to verify data integrity
    const finalTierState = db.prepare("SELECT tickets_sold FROM ticket_tiers WHERE event_id = 'EV-RACE' AND name = 'VIP'").get();
    console.log(`Final Database State: Tickets Sold = ${finalTierState.tickets_sold} (Capacity: 1)`);
});
