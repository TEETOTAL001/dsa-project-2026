// index.js
import { Event, TicketTier } from './class.js';
import { eventsStorage, handleBookingRegistration, waitlistStorage } from './objects.js';

console.log("=== Starting Capstone Project Build 1 & 2 Queue Demo ===\n");

// 1. Setup a dummy capstone event (Capacity: 3 seats max)
const capstoneEvent = new Event('EV-2026', 'Tech Summit 2026', 'Lagos', '2026-11-15');
const generalTier = new TicketTier('General', 2500, 3); 
capstoneEvent.addTier(generalTier);
eventsStorage.set(capstoneEvent.id, capstoneEvent);

// 2. Attendee A buys 2 available tickets successfully
console.log("Action: Attendee A trying to book 2 tickets...");
const order1 = handleBookingRegistration('EV-2026', 'General', 'Attendee A', 2);
console.log(`Result: ${order1.success ? 'SUCCESS ✔️ Reference: ' + order1.booking.referenceCode : 'FAILED'}\n`);

// 3. Attendee B tries to buy 2 tickets, but only 1 seat is left! Should trigger waitlist queue placement
console.log("Action: Attendee B trying to book 2 tickets (Only 1 left)...");
const order2 = handleBookingRegistration('EV-2026', 'General', 'Attendee B', 2);
console.log(`Result: Status code returned is [${order2.reason}]`);

// Convert our custom linked-list queue to an array so we can view it in the log
const currentQueue = waitlistStorage.get('EV-2026_General').toArray();
console.log(`Waitlist Log: Current custom Queue for General tier contains:`, currentQueue, "\n");

console.log("=== Demo Simulation Complete ===");
