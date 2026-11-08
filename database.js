// database.js
import { DatabaseSync } from 'node:sqlite';

export const db = new DatabaseSync('data/ticketing.db');

export function initializeDatabaseSchema() {
    // 1. Create table to store authenticated platform users (Build 7)
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('Attendee', 'Organizer', 'Staff'))
        );
    `);

    // 2. Updated events table with an owner_id column to enforce access visibility controls
    db.exec(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            venue TEXT NOT NULL,
            city TEXT NOT NULL,
            startsAt TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            owner_id TEXT,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        );
    `);

    // 3. Create table for ticket tiers
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

    // 4. Updated bookings table with an attendee_id column to keep transactions private
    db.exec(`
        CREATE TABLE IF NOT EXISTS bookings (
            reference_code TEXT PRIMARY KEY,
            event_id TEXT,
            tier_name TEXT,
            attendee_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT DEFAULT 'CONFIRMED',
            attendee_id TEXT,
            FOREIGN KEY (event_id, tier_name) REFERENCES ticket_tiers(event_id, name),
            FOREIGN KEY (attendee_id) REFERENCES users(id)
        );
    `);
}
