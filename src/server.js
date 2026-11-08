// src/server.js
import http from 'node:http';
import { initializeDatabaseSchema, db } from '../database.js'; 
import { createApp } from './http/app.js';
import { config } from './config.js';
import { Event, TicketTier } from '../class.js';
import { 
    handleUserSignup, 
    handleUserLogin, 
    handleBookingRegistration, 
    searchAndSortEvents,
    fetchAttendeeBookings,
    fetchOrganizerDashboard
} from '../objects.js';

initializeDatabaseSchema();

const app = createApp();

// Helper function to send standard JSON errors
function sendJsonError(res, statusCode, errorCode, message) {
    res.statusCode = statusCode;
    return res.end(JSON.stringify({ success: false, error: errorCode, message }));
}

// 1. Health check route
app.get('/api/health', (req, res) => {
    res.end(JSON.stringify({ status: 'UP', message: 'Secured Native Event Ticketing Server is running!' }));
});

// 2. Auth Endpoint: User Sign Up / Registration
app.post('/api/auth/signup', (req, res) => {
    const { email, password, role } = req.body;
    const result = handleUserSignup(email, password, role);
    if (!result.success) {
        return sendJsonError(res, 400, result.reason, result.message);
    }
    res.statusCode = 201;
    res.end(JSON.stringify(result));
});

// 3. Auth Endpoint: User Login (Dispatches Base64 Token)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const result = handleUserLogin(email, password);
    if (!result.success) {
        return sendJsonError(res, 401, result.reason, result.message);
    }
    res.end(JSON.stringify(result));
});

// 4. Browsing Endpoint: Search and Sort published events
app.get('/api/events/search', (req, res) => {
    const criteria = {
        text: req.query?.text,
        city: req.query?.city,
        maxPriceInCents: req.query?.maxPriceInCents ? parseInt(req.query.maxPriceInCents, 10) : undefined,
        sortBy: req.query?.sortBy
    };
    const results = searchAndSortEvents(criteria);
    res.end(JSON.stringify({ success: true, count: results.length, results }));
});

// 5. Transaction Endpoint: Create a Ticket Booking Reservation
app.post('/api/bookings', (req, res) => {
    const { eventId, tierName, attendeeName, quantity } = req.body;
    
    // Extracted securely from the active request token signature
    const attendeeId = req.user ? req.user.id : null; 

    const orderResult = handleBookingRegistration(eventId, tierName, attendeeName, quantity, attendeeId);
    if (!orderResult.success) {
        return sendJsonError(res, 400, orderResult.reason, 'Reservation booking rejected');
    }
    res.statusCode = 201;
    res.end(JSON.stringify({ success: true, booking: orderResult.booking }));
});

// 6. Privacy Secured Endpoint: Fetch Customer Bookings Dashboard
app.get('/api/my-tickets', (req, res) => {
    // S13 Access Rule: Enforce authentication barrier check
    if (!req.user) {
        return sendJsonError(res, 401, 'UNAUTHORIZED', 'Access token missing or invalid');
    }
    if (req.user.role !== 'Attendee') {
        return sendJsonError(res, 403, 'FORBIDDEN', 'Wrong-role restriction boundary enforced');
    }

    const bookings = fetchAttendeeBookings(req.user.id);
    res.end(JSON.stringify({ success: true, count: bookings.length, results: bookings }));
});

// 7. Privacy Secured Endpoint: Fetch Organizer Program Management Board
app.get('/api/organizer/dashboard', (req, res) => {
    if (!req.user) {
        return sendJsonError(res, 401, 'UNAUTHORIZED', 'Access token missing or invalid');
    }
    if (req.user.role !== 'Organizer') {
        return sendJsonError(res, 403, 'FORBIDDEN', 'Wrong-role restriction boundary enforced');
    }

    const events = fetchOrganizerDashboard(req.user.id);
    res.end(JSON.stringify({ success: true, count: events.length, results: events }));
});

// 8. Administrative Endpoint: Organizers Publish new Events
app.post('/api/events', (req, res) => {
    if (!req.user) {
        return sendJsonError(res, 401, 'UNAUTHORIZED', 'Access token missing');
    }
    if (req.user.role !== 'Organizer') {
        return sendJsonError(res, 403, 'FORBIDDEN', 'Only organizers can publish event records');
    }

    const { id, title, venue, city, startsAt, tiers } = req.body;
    if (!id || !title || !venue || !city || !startsAt) {
        return sendJsonError(res, 400, 'VALIDATION', 'Missing configuration attributes');
    }

    try {
        const insertEvent = db.prepare('INSERT INTO events (id, title, venue, city, startsAt, status, owner_id) VALUES (?, ?, ?, ?, ?, "published", ?)');
        insertEvent.run(id, title, venue, city, startsAt, req.user.id);

        if (tiers && Array.isArray(tiers)) {
            const insertTier = db.prepare('INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES (?, ?, ?, ?, 0)');
            for (const t of tiers) {
                insertTier.run(id, t.name, t.priceInCents, t.capacity);
            }
        }

        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, message: `Event '${title}' successfully published to live network indexes!` }));
    } catch (err) {
        return sendJsonError(res, 400, 'DATABASE_ERROR', err.message);
    }
});

const server = http.createServer(app.callback());

server.listen(config.port, () => {
    console.log(`🚀 Security server successfully listening at http://localhost:${config.port}`);
});
