// src/server.js
import http from 'node:http';
import { initializeDatabaseSchema } from '../database.js'; 
import { createApp } from './http/app.js';
import { config } from './config.js';

// 1. Initialize SQLite tables automatically on server startup
initializeDatabaseSchema();

// 2. Build the app interface wrapper using our custom core routing engine
const app = createApp();

// 3. Health check route using our custom app method
app.get('/api/health', (req, res) => {
    res.end(JSON.stringify({ status: 'UP', message: 'Native Event Ticketing Server is running!' }));
});

// 4. Wrap everything into Node's native HTTP cluster server module
const server = http.createServer(app.callback());

server.listen(config.port, () => {
    console.log(`🚀 Native server successfully listening at http://localhost:${config.port}`);
});