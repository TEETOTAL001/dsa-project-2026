-- src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Attendee', 'Organizer', 'Staff'))
);

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

CREATE TABLE IF NOT EXISTS bookings (
    reference_code TEXT PRIMARY KEY,
    event_id TEXT,
    tier_name TEXT,
    attendee_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'CONFIRMED',
    attendee_id TEXT,
    created_at INTEGER DEFAULT 0,
    FOREIGN KEY (event_id, tier_name) REFERENCES ticket_tiers(event_id, name),
    FOREIGN KEY (attendee_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS waitlist_queues (
    id TEXT PRIMARY KEY,
    event_id TEXT,
    tier_name TEXT,
    user_id TEXT,
    joined_at INTEGER NOT NULL,
    offer_expires_at INTEGER DEFAULT NULL,
    status TEXT CHECK(status IN ('WAITING', 'OFFERED', 'EXPIRED', 'ACCEPTED')) DEFAULT 'WAITING',
    FOREIGN KEY (event_id, tier_name) REFERENCES ticket_tiers(event_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
