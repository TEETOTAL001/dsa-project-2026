// public/app.js

// Dynamic asynchronous loader to fetch real event records from our database endpoint (Build 7)
async function fetchAndRenderDashboard() {
    const displayContainer = document.getElementById('events-display');
    
    try {
        // Fire network fetch call to hit our custom native search API endpoint route (GET)
        const response = await fetch('/api/events/search');
        const data = await response.json();

        if (!data.success || data.results.length === 0) {
            displayContainer.innerHTML = `<p>No live events found inside the database storage file.</p>`;
            return;
        }

        displayContainer.innerHTML = ''; // Clear out initialization placeholder tags

        // Map live database records into interactive graphical layout elements
        data.results.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';

            // Convert event sub-resource object map layout entries into option tags dynamically
            // Note: Since data comes back from server JSON, tiers are standard object structures
            const tierOptions = Object.values(event.tiers).map(t => 
                `<option value="${t.name}">${t.name} — $${(t.priceInCents / 100).toFixed(2)} (${t.capacity - t.ticketsSold} left)</option>`
            ).join('');

            card.innerHTML = `
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <strong>📍 Location:</strong> ${event.city}<br>
                    <strong>📅 Date:</strong> ${event.startsAt}
                </div>
                <label for="tier-${event.id}"><strong>Choose Ticket Tier:</strong></label>
                <select id="tier-${event.id}" class="tier-select">
                    ${tierOptions}
                </select>
                <button class="btn-book" onclick="processLiveBooking('${event.id}', '${event.title}')">
                    Reserve Seat Now
                </button>
            `;
            displayContainer.appendChild(card);
        });

    } catch (err) {
        displayContainer.innerHTML = `<p style="color: red;">Failed to communicate with live API server engine: ${err.message}</p>`;
    }
}

// User submission transaction handler executing raw POST payloads across the network
window.processLiveBooking = async function(eventId, eventTitle) {
    const selectedTier = document.getElementById(`tier-${eventId}`).value;
    const attendeeName = prompt(`Enter customer name to confirm booking for ${eventTitle} (${selectedTier} Tier):`);

    if (!attendeeName) return; // Exit gracefully if user hits cancel

    try {
        // Execute dynamic HTTP POST fetch payload transfer across network lines
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventId: eventId,
                tierName: selectedTier,
                attendeeName: attendeeName,
                quantity: 1 // Standardize single allocation purchase rule for validation checkpoint
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`🎉 Booking Confirmed Successfully!\n\nReference: ${result.booking.referenceCode}\nAttendee: ${attendeeName}\nEvent: ${eventTitle}`);
            fetchAndRenderDashboard(); // Hot reload layout to automatically sync updated ticket availability counts!
        } else {
            alert(`❌ Reservation Request Denied:\nReason: ${result.message || result.error}`);
        }

    } catch (err) {
        alert(`❌ Network transmission failure: ${err.message}`);
    }
};

// Start system initialization tracking on layout boot
document.addEventListener('DOMContentLoaded', fetchAndRenderDashboard);
