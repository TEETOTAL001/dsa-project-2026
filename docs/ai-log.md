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


# AI Log: Build 5

## What I asked:
I requested a migration of the system storage state layer from transient in-memory objects to a persistent SQLite database structure using Node's native database connector. I also required a validation script to fire 50 rapid parallel bookings against an event tier holding exactly 1 seat left to guarantee concurrency protection.

## What came back:
A structural layout inside `database.js` executing schema tables using integrated SQL checks (`CHECK (tickets_sold <= capacity)`). This is backed by a transactional execution strategy in `objects.js` and an automated simulation runner loop configured inside `simulate.js`.

## What was wrong or changed:
Nothing. The database level table check intercepted the overflow attempts natively, ensuring exactly 1 attendee succeeded while rejecting the remaining 49 racing requests cleanly with a SOLD_OUT status.


# AI Log: Build 6

## What I asked:
I requested a browser-based frontend dashboard layer driven by standalone mock data models to let users interactively view available program events, pick matching ticket tiers, and see booking confirmation states. I also required my native HTTP backend app engine structure to be modularly re-aligned with my instructor's folder layout architecture.

## What came back:
A complete `public/` directory hosting static user interfaces (`index.html` and `app.js`). This is paired with an updated native server infrastructure file mapping inside `src/http/app.js` capable of dynamically serving static file headers over local connection ports.

## What was wrong or changed:
The frontend script was initially stuck on a "Loading premium event listings..." screen. This was caused by Node's native path solver parsing the leading slash of the requested path (`/app.js`) as an absolute machine root location. Resolved the issue by using `.slice(1)` inside `src/http/app.js` to strip out the leading slash, enabling clean local path resolution on Windows.



# AI Log: Build 8

## What I asked:
I requested a full structural refactoring of the application's data management tier to implement the Repository and Service patterns. Database initialization must run on a standalone `.sql` schema script file, and write operations must be safeguarded with Write-Ahead Logging (WAL) and atomic inventory updates.

## What came back:
Modular data repository blocks inside `src/repositories/sqlite.js` handling clean table queries, dedicated service coordinators in `src/services/` enforcing business validations, a separate `src/db/schema.sql` template, and a connection configuration enabling `journal_mode = WAL` and `foreign_keys = ON`.

## What was wrong or changed:
Encountered an initial `ERR_MODULE_NOT_FOUND` error due to a minor folder directory naming typo (`respositories` instead of `repositories`). Once renamed, the file pathways aligned perfectly. All 9 structural integration tests pass completely without errors or performance lag.
