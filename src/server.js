// src/server.js
import http from 'node:http';
import { initializeDatabaseSchema, db } from '../database.js'; 
import { createApp } from './http/app.js';
import { config } from './config.js';
import { handleBookingRegistration, searchAndSortEvents } from '../objects.js';

// 1. Initialize SQLite database schemas automatically on start
initializeDatabaseSchema();

const app = createApp();

// 2. Base platform system health endpoint
app.get('/api/health', (req, res) => {
    res.end(JSON.stringify({ status: 'UP', message: 'Native Event Ticketing Server is running!' }));
});

// 3. Dynamic search API route: Frontend pulls active events records out of SQL disk storage here
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

// 4. Dynamic transaction POST endpoint: Saves actual bookings into permanent database rows
app.post('/api/bookings', (req, res) => {
    const { eventId, tierName, attendeeName, quantity } = req.body;
    
    const orderResult = handleBookingRegistration(eventId, tierName, attendeeName, quantity);
    
    if (!orderResult.success) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ success: false, error: orderResult.reason, message: 'Ticketing operation rejected' }));
    }
    
    res.statusCode = 201;
    res.end(JSON.stringify({ success: true, booking: orderResult.booking }));
});

const server = http.createServer(app.callback());

server.listen(config.port, () => {
    console.log(`🚀 Native server successfully listening at http://localhost:${config.port}`);
});
