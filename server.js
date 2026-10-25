// server.js
import express from 'express';
import { 
    eventsStorage, 
    bookingsStorage,
    handleBookingRegistration, 
    searchAndSortEvents, 
    handlePaymentProcessing, 
    handleBookingCancellation 
} from './objects.js';
import { Event, TicketTier } from './class.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to keep error response structures identical across all endpoints
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

// 2. Create an Event with ticket tiers
app.post('/api/events', (req, res) => {
    const { id, title, city, date, tiers } = req.body;

    if (!id || !title || !city || !date) {
        return sendErrorResponse(res, 400, 'VALIDATION', 'Missing required event fields');
    }

    const newEvent = new Event(id, title, city, date);

    if (tiers && Array.isArray(tiers)) {
        for (const t of tiers) {
            newEvent.addTier(new TicketTier(t.name, t.priceInCents, t.capacity));
        }
    }

    eventsStorage.set(id, newEvent);

    return res.status(201).json({
        success: true,
        message: `Event '${title}' successfully created!`,
        event: { id: newEvent.id, title: newEvent.title, city: newEvent.city, date: newEvent.date }
    });
});

// 3. Search and sort published events via query links
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
        if (orderResult.reason === 'SOLD_OUT_ADDED_TO_WAITLIST') {
            return res.status(202).json({ success: false, status: 'WAITLISTED', message: 'Added to waitlist.' });
        }
        return sendErrorResponse(res, 400, orderResult.reason, 'Reservation booking rejected');
    }

    return res.status(201).json({ success: true, status: 'CONFIRMED', booking: orderResult.booking });
});

// 5. Route Endpoint: Confirm Payment for an open booking (Mock execution)
app.post('/api/bookings/:refCode/pay', (req, res) => {
    const { refCode } = req.params;
    const paymentResult = handlePaymentProcessing(refCode);

    if (!paymentResult.success) {
        return sendErrorResponse(res, 400, paymentResult.reason, 'Payment processing transaction rejected');
    }

    return res.json({ success: true, message: 'Payment confirmed successfully', booking: paymentResult.booking });
});

// 6. Route Endpoint: Cancel an unpaid pending booking
app.post('/api/bookings/:refCode/cancel', (req, res) => {
    const { refCode } = req.params;
    const cancelResult = handleBookingCancellation(refCode);

    if (!cancelResult.success) {
        return sendErrorResponse(res, 400, cancelResult.reason, 'Cancellation request refused');
    }

    return res.json({ success: true, message: 'Booking successfully cancelled', booking: cancelResult.booking });
});

app.listen(PORT, () => {
    console.log(`🚀 Server successfully listening at http://localhost:${PORT}`);
});
