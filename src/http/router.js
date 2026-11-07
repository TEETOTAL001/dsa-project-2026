// src/http/router.js

export class Router {
    #routes = [];

    // Register a GET route
    get(path, handler) {
        this.#routes.push({ method: 'GET', path, segments: path.split('/').filter(Boolean), handler });
    }

    // Register a POST route
    post(path, handler) {
        this.#routes.push({ method: 'POST', path, segments: path.split('/').filter(Boolean), handler });
    }

    // Match incoming requests against registered routes
    match(reqMethod, reqUrl) {
        const urlPath = reqUrl.split('?')[0];
        const requestedSegments = urlPath.split('/').filter(Boolean);

        for (const route of this.#routes) {
            if (route.method !== reqMethod.toUpperCase()) continue;
            if (route.segments.length !== requestedSegments.length) continue;

            const params = {};
            let matches = true;

            for (let index = 0; index < route.segments.length; index++) {
                const expected = route.segments[index];
                const actual = requestedSegments[index];

                if (expected.startsWith(':')) {
                    params[expected.slice(1)] = actual;
                } else if (expected !== actual) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                return { handler: route.handler, params };
            }
        }
        return null;
    }
}
