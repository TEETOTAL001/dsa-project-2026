// populate.js
import { db, initializeDatabaseSchema } from './database.js';
import { hashPassword } from './src/domain/auth.js';
import { generateId } from './src/domain/ids.js';

initializeDatabaseSchema();

db.exec('DELETE FROM bookings;');
db.exec('DELETE FROM ticket_tiers;');
db.exec('DELETE FROM events;');
db.exec('DELETE FROM users;');

console.log("Seeding Build 7 Authentication User Records...");

const orgId = generateId();
const attId = generateId();
const staffId = generateId();

// Pre-register three accounts with separate access roles
const insertUser = db.prepare('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)');
insertUser.run(orgId, 'organizer@test.com', hashPassword('pass123'), 'Organizer');
insertUser.run(attId, 'attendee@test.com', hashPassword('pass123'), 'Attendee');
insertUser.run(staffId, 'staff@test.com', hashPassword('pass123'), 'Staff');

const insertEvent = db.prepare('INSERT INTO events (id, title, venue, city, startsAt, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
insertEvent.run('EV-1', 'Afrobeats Mega Fest', 'Eko Energy City', 'Lagos', '2026-12-25', 'published', orgId);
insertEvent.run('EV-2', 'Nvidia AI Summit', 'ICC Exhibition Hall', 'Abuja', '2026-11-10', 'published', orgId);

const insertTier = db.prepare('INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES (?, ?, ?, ?, 0)');
insertTier.run('EV-1', 'Regular Deck', 4500, 150);
insertTier.run('EV-1', 'VIP Lounge', 15000, 20);
insertTier.run('EV-2', 'General Pass', 2500, 80);

console.log(`Database Successfully Seeded for Build 7! ✅\nLogins available (Password: pass123):\n- organizer@test.com\n- attendee@test.com\n- staff@test.com`);
