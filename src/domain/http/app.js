// src/http/app.js
import { Router } from './router.js';

export function createApp() {
    const router = new Router();

    const serverHandler = (req, res) => {
        // Set standard response headers
        res.setHeader('Content-Type', 'application/json');

        const routeMatch = router.match(req.method, req.url);

        if (routeMatch) {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                req.body = body ? JSON.parse(body) : {};
                req.params = routeMatch.params;
                routeMatch.handler(req, res);
            });
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'NOT_FOUND', message: `Cannot ${req.method} ${req.url}` }));
        }
    };

    return {
        get: (path, handler) => router.get(path, handler),
        post: (path, handler) => router.post(path, handler),
        callback: () => serverHandler
    };
}
