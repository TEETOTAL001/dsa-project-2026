// database.js
import { DatabaseSync } from 'node:sqlite';

// Connect to a local database file (creates it automatically if missing)
export const db = new DatabaseSync('data/ticketing.db');

export function initializeDatabaseSchema() {
    // 1. Create table to store permanent events
    db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            venue TEXT NOT NULL,
            city TEXT NOT NULL,
            startsAt TEXT NOT NULL,
            status TEXT DEFAULT 'draft'
        );
    `);

    // 2. Create table for ticket tiers with a critical constraint check
    db.exec(`
        CREATE TABLE IF NOT EXISTS ticket_tiers (
            event_id TEXT,
            name TEXT,
            price_in_cents INTEGER NOT NULL,
            capacity INTEGER NOT NULL,
            tickets_sold INTEGER DEFAULT 0,
            PRIMARY KEY (event_id, name),
            FOREIGN KEY (event_id) REFERENCES events(id),
            CHECK (tickets_sold <= capacity)
        );
    `);

    // 3. Create table to permanently store booking transactions
    db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
            reference_code TEXT PRIMARY KEY,
            event_id TEXT,
            tier_name TEXT,
            attendee_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT DEFAULT 'CONFIRMED',
            FOREIGN KEY (event_id, tier_name) REFERENCES ticket_tiers(event_id, name)
        );
    `);
}
