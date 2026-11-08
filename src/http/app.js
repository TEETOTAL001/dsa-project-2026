// src/http/app.js
import fs from 'node:fs';
import path from 'node:path';
import { Router } from './router.js';
import { verifyToken } from '../domain/auth.js';

export function createApp() {
    const router = new Router();

    const serverHandler = (req, res) => {
        // 1. EXTRACT NATIVE USER SIGNED AUTHENTICATION TOKEN MIDDLEWARE LAYERS
        req.user = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            req.user = verifyToken(token); 
        }

        // 2. BULLETPROOF STATIC FILE HANDLER FOR FRONTEND ASSETS
        // Cleans up trailing query characters or extensions seamlessly
        const cleanUrl = req.url.split('?')[0];

        if (req.method === 'GET' && (cleanUrl === '/' || cleanUrl === '/index.html' || cleanUrl === '/app.js')) {
            const fileName = cleanUrl === '/' ? 'index.html' : cleanUrl.slice(1);
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

        // 3. REST API ROUTE ENGINE MULTIPLEXER
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
