// server.js
import express from 'express';
import { eventsStorage, handleBookingRegistration, searchAndSortEvents } from './objects.js';
import { Event, TicketTier } from './class.js';

const app = express();
const PORT = 3000;

// Middleware to handle JSON payload data requests
app.use(express.json());

// 1. Health check route to confirm the server is running
app.get('/api/health', (req, res) => {
    res.json({ status: 'UP', message: 'Event Ticketing Server is running!' });
});

// 2. Create an Event dynamically over the web
app.post('/api/events', (req, res) => {
    const { id, title, city, date, tiers } = req.body;

    if (!id || !title || !city || !date) {
        return res.status(400).json({ error: 'VALIDATION', message: 'Missing required event fields' });
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
        message: `Event '${title}' successfully created in memory storage!`,
        event: { id: newEvent.id, title: newEvent.title, city: newEvent.city, date: newEvent.date, totalTiersCount: newEvent.tiers.size }
    });
});

// 3. New Route: Search and Sort Events over the web using URL queries!
// Example: http://localhost:3000/api/events/search?city=Lagos&sortBy=date
app.get('/api/events/search', (req, res) => {
    const { text, city, maxPriceInCents, sortBy } = req.query;

    const criteria = {
        text,
        city,
        maxPriceInCents: maxPriceInCents ? parseInt(maxPriceInCents, 10) : undefined,
        sortBy
    };

    // Calls your custom filter engine and Merge Sort algorithm automatically
    const filteredResults = searchAndSortEvents(criteria);
    return res.json({ success: true, count: filteredResults.length, results: filteredResults });
});

// 4. New Route: Purchase a Ticket booking dynamically!
app.post('/api/bookings', (req, res) => {
    const { eventId, tierName, attendeeName, quantity } = req.body;

    if (!eventId || !tierName || !attendeeName || !quantity) {
        return res.status(400).json({ error: 'VALIDATION', message: 'Missing fields for ticket order registration' });
    }

    // Process order constraints via your objects.js engine
    const orderResult = handleBookingRegistration(eventId, tierName, attendeeName, parseInt(quantity, 10));

    if (!orderResult.success) {
        if (orderResult.reason === 'SOLD_OUT_ADDED_TO_WAITLIST') {
            return res.status(202).json({
                success: false,
                status: 'WAITLISTED',
                message: 'Ticket tier tier is sold out. You have been added to the sequential waitlist queue.'
            });
        }
        return res.status(400).json({ success: false, error: orderResult.reason });
    }

    return res.status(201).json({
        success: true,
        status: 'CONFIRMED',
        message: 'Ticket order successfully processed and confirmed!',
        booking: orderResult.booking
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server successfully listening at http://localhost:${PORT}`);
});
