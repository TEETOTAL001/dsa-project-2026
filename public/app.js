// public/app.js

// Hardcoded mock dataset to drive Build 6 frontend layout locally
const mockEvents = [
    {
        id: "E1",
        title: "Afrobeats Fest 2026",
        city: "Lagos",
        date: "2026-12-25",
        tiers: [
            { name: "Regular", price: "$50.00", availability: "Available" },
            { name: "VIP", price: "$150.00", availability: "Limited Seats" }
        ]
    },
    {
        id: "E2",
        title: "Global Tech Summit",
        city: "Abuja",
        date: "2026-11-10",
        tiers: [
            { name: "General Admission", price: "$20.00", availability: "Available" },
            { name: "VIP Access", price: "$100.00", availability: "Sold Out" }
        ]
    },
    {
        id: "E3",
        title: "Night of Jazz & Strings",
        city: "Lagos",
        date: "2026-10-05",
        tiers: [
            { name: "Standard Entry", price: "$35.00", availability: "Available" }
        ]
    }
];

// Renders event elements into our container layout DOM target
function renderEventDashboard() {
    const displayContainer = document.getElementById('events-display');
    displayContainer.innerHTML = ''; // Wipes placeholder text

    mockEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';

        // Map drop down list values dynamically from array layers
        const tierOptions = event.tiers.map(t => 
            `<option value="${t.name}">${t.name} — ${t.price} (${t.availability})</option>`
        ).join('');

        card.innerHTML = `
            <h3 class="event-title">${event.title}</h3>
            <div class="event-meta">
                <strong>📍 Location:</strong> ${event.city}<br>
                <strong>📅 Date:</strong> ${event.date}
            </div>
            <label for="tier-${event.id}"><strong>Choose Ticket Tier:</strong></label>
            <select id="tier-${event.id}" class="tier-select">
                ${tierOptions}
            </select>
            <button class="btn-book" onclick="triggerMockBooking('${event.title}', '${event.id}')">
                Reserve Seat Now
            </button>
        `;
        displayContainer.appendChild(card);
    });
}

// User action handler displaying selected tier alert state
window.triggerMockBooking = function(eventTitle, eventId) {
    const selectedTier = document.getElementById(`tier-${eventId}`).value;
    alert(`🎉 Mock Booking Success!\nEvent: ${eventTitle}\nSelected Tier: ${selectedTier}\n\n(Build 6 Front-end Mock Phase Working Correctly!)`);
};

// Fire up layout rendering when page initialization completes
document.addEventListener('DOMContentLoaded', renderEventDashboard);
