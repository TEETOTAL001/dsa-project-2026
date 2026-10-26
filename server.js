// server.js
import express from 'express';
import { initializeDatabaseSchema } from './database.js'; // Look here! Import our schema launcher.
import { 
    handleBookingRegistration, 
    searchAndSortEvents, 
    handlePaymentProcessing, 
    handleBookingCancellation 
} from './objects.js';
import { db } from './database.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite tables automatically on server startup (Build 5)
initializeDatabaseSchema();

function sendErrorResponse(res, statusCode, errorCode, message) {
    return res.status(statusCode).json({
        success: false,
        error: errorCode,
        message: message
    });
}

// 1. Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', message: 'Event Ticketing Server is running!' });
});

// 2. Create an Event with ticket tiers directly in SQLite
app.post('/api/events', (req, res) => {
    const { id, title, city, date, tiers } = req.body;

    if (!id || !title || !city || !date) {
        return sendErrorResponse(res, 400, 'VALIDATION', 'Missing required event fields');
    }

    try {
        const insertEvent = db.prepare('INSERT INTO events (id, title, city, date) VALUES (?, ?, ?, ?)');
        insertEvent.run(id, title, city, date);

        if (tiers && Array.isArray(tiers)) {
            const insertTier = db.prepare('INSERT INTO ticket_tiers (event_id, name, price_in_cents, capacity, tickets_sold) VALUES (?, ?, ?, ?, 0)');
            for (const t of tiers) {
                insertTier.run(id, t.name, t.priceInCents, t.capacity);
            }
        }

        return res.status(201).json({
            success: true,
            message: `Event '${title}' successfully created in SQLite database!`,
            event: { id, title, city, date }
        });
    } catch (err) {
        return sendErrorResponse(res, 400, 'DATABASE_ERROR', err.message);
    }
});

// 3. Search and sort published events via URL queries
app.get('/api/events/search', (req, res) => {
    const { text, city, maxPriceInCents, sortBy } = req.query;

    const criteria = {
        text,
        city,
        maxPriceInCents: maxPriceInCents ? parseInt(maxPriceInCents, 10) : undefined,
        sortBy
    };

    const results = searchAndSortEvents(criteria);
    return res.json({ success: true, count: results.length, results });
});

// 4. Create a ticket booking reservation
app.post('/api/bookings', (req, res) => {
    const { eventId, tierName, attendeeName, quantity } = req.body;

    if (!eventId || !tierName || !attendeeName || !quantity) {
        return sendErrorResponse(res, 400, 'VALIDATION', 'Missing fields for ticket order registration');
    }

    const orderResult = handleBookingRegistration(eventId, tierName, attendeeName, parseInt(quantity, 10));

    if (!orderResult.success) {
        return sendErrorResponse(res, 400, orderResult.reason, 'Reservation booking rejected');
    }

    return res.status(201).json({ success: true, status: 'CONFIRMED', booking: orderResult.booking });
});

// 5. Confirm Payment for an open booking
app.post('/api/bookings/:refCode/pay', (req, res) => {
    const { refCode } = req.params;
    const paymentResult = handlePaymentProcessing(refCode);

    if (!paymentResult.success) {
        return sendErrorResponse(res, 400, paymentResult.reason, 'Payment processing transaction rejected');
    }

    return res.json({ success: true, message: 'Payment confirmed successfully', booking: paymentResult.booking });
});

// 6. Cancel an unpaid pending booking
app.post('/api/bookings/:refCode/cancel', (req, res) => {
    const { refCode } = req.params;
    const cancelResult = handleBookingCancellation(refCode);

    if (!cancelResult.success) {
        return sendErrorResponse(res, 400, cancelResult.reason, 'Cancellation request refused');
    }

    return res.json({ success: true, message: 'Booking successfully cancelled', booking: cancelResult.booking });
});

app.listen(PORT, () => {
    console.log(`🚀 Database server successfully listening at http://localhost:${PORT}`);
});
