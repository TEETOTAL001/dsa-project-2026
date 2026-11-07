// src/http/app.js
import fs from 'node:fs';
import path from 'node:path';
import { Router } from './router.js';

export function createApp() {
    const router = new Router();

    const serverHandler = (req, res) => {
        // 1. FIXED STATIC FILE HANDLER FOR SYSTEM FRONTEND (Build 6)
        if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html' || req.url === '/app.js')) {
            // Strip the leading slash from the requested URL to target local folder assets correctly
            const fileName = req.url === '/' ? 'index.html' : req.url.slice(1);
            const filePath = path.join(process.cwd(), 'public', fileName);
            const contentType = fileName.endsWith('.js') ? 'application/javascript' : 'text/html';
            
            try {
                const fileContents = fs.readFileSync(filePath);
                res.writeHead(200, { 'Content-Type': contentType });
                return res.end(fileContents);
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'SERVER_ERROR', message: err.message }));
            }
        }

        // 2. EXISTING REST API ROUTE HANDLER (Build 3 & 4)
        res.setHeader('Content-Type', 'application/json');
        const routeMatch = router.match(req.method, req.url);

        if (routeMatch) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    req.body = body ? JSON.parse(body) : {};
                } catch (e) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ error: 'BAD_REQUEST', message: 'Invalid JSON body' }));
                }
                req.params = routeMatch.params;
                routeMatch.handler(req, res);
            });
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'NOT_FOUND', message: `Cannot ${req.method} ${req.url}` }));
        }
    };

    return {
        get: (pathStr, handler) => router.get(pathStr, handler),
        post: (pathStr, handler) => router.post(pathStr, handler),
        callback: () => serverHandler
    };
}
