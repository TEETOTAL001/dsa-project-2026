// src/server.js
import http from 'node:http';
import { initializeDatabaseSchema, db } from '../database.js'; 
import { createApp } from './http/app.js';
import { config } from './config.js';

// Import our secure Enterprise Service Layers
import { EventService } from './services/eventService.js';
import { BookingService } from './services/bookingService.js';
import { SQLiteUserRepository, SQLiteEventRepository, SQLiteBookingRepository } from './repositories/sqlite.js';
import { handleUserSignup, handleUserLogin } from '../objects.js';

initializeDatabaseSchema();

const app = createApp();

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

// 4. Browsing Endpoint: Refactored to fetch elements via EventService
app.get('/api/events/search', (req, res) => {
    const urlParts = req.url.split('?');
    const queryParams = {};
    if (urlParts.length > 1) {
        const pairs = urlParts[1].split('&');
        for (const pair of pairs) {
            const [key, val] = pair.split('=');
            if (key) queryParams[key] = decodeURIComponent(val || '');
        }
    }

    const criteria = {
        text: req.query?.text || queryParams.text,
        city: req.query?.city || queryParams.city,
        maxPriceInCents: (req.query?.maxPriceInCents || queryParams.maxPriceInCents) ? parseInt(req.query?.maxPriceInCents || queryParams.maxPriceInCents, 10) : undefined,
        sortBy: req.query?.sortBy || queryParams.sortBy
    };
    
    const results = EventService.searchAndSort(criteria);
    res.end(JSON.stringify({ success: true, count: results.length, results }));
});

// 5. Transaction Endpoint: Refactored to check out via BookingService
app.post('/api/bookings', (req, res) => {
    const { eventId, tierName, attendeeName, quantity } = req.body;
    const attendeeId = req.user ? req.user.id : null; 

    const orderResult = BookingService.registerBooking(eventId, tierName, attendeeName, quantity, attendeeId);
    if (!orderResult.success) {
        return sendJsonError(res, 400, orderResult.reason, 'Reservation booking rejected');
    }
    res.statusCode = 201;
    res.end(JSON.stringify({ success: true, booking: orderResult.booking }));
});

// 6. Privacy Secured Endpoint: Pull customer bookings via repository layout
app.get('/api/my-tickets', (req, res) => {
    if (!req.user) {
        return sendJsonError(res, 401, 'UNAUTHORIZED', 'Access token missing or invalid');
    }
    if (req.user.role !== 'Attendee') {
        return sendJsonError(res, 403, 'FORBIDDEN', 'Wrong-role restriction boundary enforced');
    }

    const bookings = SQLiteBookingRepository.findByAttendeeId(req.user.id);
    res.end(JSON.stringify({ success: true, count: bookings.length, results: bookings }));
});

// 7. Privacy Secured Endpoint: Pull organizer records via repository layout
app.get('/api/organizer/dashboard', (req, res) => {
    if (!req.user) {
        return sendJsonError(res, 401, 'UNAUTHORIZED', 'Access token missing or invalid');
    }
    if (req.user.role !== 'Organizer') {
        return sendJsonError(res, 403, 'FORBIDDEN', 'Wrong-role restriction boundary enforced');
    }

    const events = SQLiteEventRepository.findByOrganizerId(req.user.id);
    res.end(JSON.stringify({ success: true, count: events.length, results: events }));
});

// 8. Dynamic Payment Execution Route Mapping Integration
app.post('/api/bookings/:refCode/pay', (req, res) => {
    const { refCode } = req.params;
    const paymentResult = BookingService.processPayment(refCode);
    
    if (!paymentResult.success) {
        return sendJsonError(res, 400, paymentResult.reason, 'Payment processing transaction declined');
    }
    res.end(JSON.stringify(paymentResult));
});

// 9. Administrative Endpoint: Organizers Publish new Events via repositories
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
        SQLiteEventRepository.save({ id, title, venue, city, startsAt, status: 'published' }, req.user.id);

        if (tiers && Array.isArray(tiers)) {
            for (const t of tiers) {
                SQLiteEventRepository.saveTier(id, { name: t.name, priceInCents: t.priceInCents, capacity: t.capacity, ticketsSold: 0 });
            }
        }

        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, message: `Event '${title}' successfully published!` }));
    } catch (err) {
        return sendJsonError(res, 400, 'DATABASE_ERROR', err.message);
    }
});

const server = http.createServer(app.callback());

server.listen(config.port, () => {
    console.log(`🚀 Architecture server successfully listening at http://localhost:${config.port}`);
});
