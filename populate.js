// populate.js
import { db, initializeDatabaseSchema } from './database.js';

initializeDatabaseSchema();

// Clear old records to avoid duplicate primary key collisions
db.exec('DELETE FROM bookings;');
db.exec('DELETE FROM ticket_tiers;');
db.exec('DELETE FROM events;');

console.log("Seeding live database records...");

// Insert matching tutor layout profiles
const insertEvent = db.prepare('INSERT INTO events (id, title, venue, city, startsAt, status) VALUES (?, ?, ?, ?, ?, ?)');
insertEvent.run('EV-1', 'Afrobeats Mega Fest', 'Eko Energy City', 'Lagos', '2026-12-25', 'published');
insertEvent.run('EV-2', 'Nvidia AI Summit', 'ICC Exhibition Hall', 'Abuja', '2026-11-10', 'published');

const insertTier = db.prepare('INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES (?, ?, ?, ?, 0)');
insertTier.run('EV-1', 'Regular Deck', 4500, 150);
insertTier.run('EV-1', 'VIP Lounge', 15000, 20);
insertTier.run('EV-2', 'General Pass', 2500, 80);
// Add these lines right at the bottom of populate.js
insertEvent.run('EV-3', 'Night of Jazz & Strings', 'Muson Centre', 'Lagos', '2026-10-05', 'published');
insertTier.run('EV-3', 'Standard Entry', 3500, 60);


console.log("Database successfully seeded with active event records! ✅");