# AI Log: Build 1

## What I asked:
I initialized a blank JavaScript repository using modern ES Modules (`"type": "module"`). I requested structural classes for Event, TicketTier, and Booking models, along with an execution engine (`objects.js`) capable of handling basic validations, capacity constraints, and waitlist registration utilizing optimized `Map` lookups.

## What came back:
A complete code blueprint spanning `class.js`, `objects.js`, and `index.js`. It tracks currency in whole cents, executes validations for quantities (>0 and <=10), leverages `Map` for high-performance sub-resource access, and handles capacity overflows by pushing data into a waitlist array.

## What was wrong or changed:
Nothing. The baseline application rules compiled immediately on the Windows Command Prompt and produced the exact simulated timeline logs required by the course criteria.

# AI Log: Build 2

## What I asked:
I requested search, filtering, and sorting functionality for events. The query engine needs to sort matches chronologically by date or price by passing data structures through a custom, stable Merge Sort algorithm. The main structural constraint is that sorting must never change the layout of the original global storage lists.

## What came back:
A dedicated sorting utility script (`sorting.js`) containing a clean recursive Merge Sort implementation. It copy-isolates input arrays using `.slice()` to guarantee complete data immutability, preserving the arrangement of the core memory table.

## What was wrong or changed:
Nothing. An automated test script (`index.test.js`) was configured to evaluate the query parameters against standard validation logic, passing 5 out of 5 assertion scenarios successfully on Node's native test runner.

# AI Log: Build 3

## What I asked:
I requested an Express.js network architecture skeleton to wrap my core domain logic modules into a live REST API backend application server. I needed endpoints configured to accept inbound JSON payload objects to handle program event creation, parse URL context queries to tap into my custom Merge Sort filtering engine, and map user registration actions directly to my ticketing and validation tracker routines.

## What came back:
A complete web server codebase tracking system written inside `server.js` using the Express framework. It applies body-parsing middleware structures, maps custom route targets (`/api/events`, `/api/events/search`, and `/api/bookings`), and maps application statuses directly to proper network delivery codes (`200 OK`, `201 Created`, `202 Accepted`, and `400 Bad Request`).

## What was wrong or changed:
An initial boot runtime crashed with an `ERR_MODULE_NOT_FOUND` message because local environment packages weren't downloaded yet. This was fully fixed by initializing the ecosystem through a local terminal execution of `npm install`, which compiled the local tracking folders cleanly.


# AI Log: Build 4

## What I asked:
I requested REST API endpoints to support end-to-end booking life cycle transformations—specifically processing mock transaction payments and handling unpaid seat cancellations. The logic must isolate mutations to ensure state transition boundary changes are fully verified by automated unit tests.

## What came back:
Updated route handlers in `server.js` (`/api/bookings/:refCode/pay` and `/api/bookings/:refCode/cancel`) paired with state management methods inside `objects.js`. The solution implements uniform error payloads and returns exact HTTP network codes matching transaction outcomes.

## What was wrong or changed:
Nothing. The business state transition filters matched all acceptance criteria immediately, passing the full test engine execution block with 7 out of 7 successful test validations.
