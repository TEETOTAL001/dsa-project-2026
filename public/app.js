// public/app.js

let countdownInterval = null;
let currentActiveBookingRef = null;

async function fetchAndRenderDashboard() {
    const displayContainer = document.getElementById('events-display');
    
    try {
        const response = await fetch('/api/events/search');
        const data = await response.json();

        if (!data.success || data.results.length === 0) {
            displayContainer.innerHTML = `<p>No live events found inside the database storage file.</p>`;
            return;
        }

        displayContainer.innerHTML = '';

        data.results.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';

            const tierOptions = Object.values(event.tiers).map(t => {
                const isSoldOut = t.ticketsSold >= t.capacity;
                const displayText = isSoldOut 
                    ? `${t.name} — SOLD OUT ❌` 
                    : `${t.name} — $${(t.priceInCents / 100).toFixed(2)} (${t.capacity - t.ticketsSold} left)`;
                return `<option value="${t.name}" ${isSoldOut ? 'disabled' : ''}>${displayText}</option>`;
            }).join('');

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

window.processLiveBooking = async function(eventId, eventTitle) {
    const selectedTier = document.getElementById(`tier-${eventId}`).value;
    const attendeeName = prompt(`Enter customer name to confirm reservation:`);

    if (!attendeeName) return;

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, tierName: selectedTier, attendeeName, quantity: 1 })
        });

        const result = await response.json();

        if (result.success) {
            currentActiveBookingRef = result.booking.referenceCode;
            launchCheckoutModal(eventTitle, selectedTier, attendeeName);
        } else {
            alert(`❌ Booking Refused: ${result.message || result.error}`);
        }
    } catch (err) {
        alert(`❌ Network failure: ${err.message}`);
    }
};

// Build 6: Open payment panel with a functional 5-minute countdown clock
function launchCheckoutModal(eventTitle, tierName, attendeeName) {
    document.getElementById('booking-details-text').innerText = `Attendee: ${attendeeName}\nEvent: ${eventTitle} (${tierName})`;
    document.getElementById('payment-error').style.display = 'none';
    document.getElementById('checkout-modal').style.display = 'flex';
    
    let totalSeconds = 5 * 60; // 5 minute ticket holding counter bounds
    const timerDisplay = document.getElementById('timer-display');
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        totalSeconds--;
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `Time Remaining: ${minutes}:${seconds}`;
        
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            alert("⏳ Checkout session timed out! Your reserved seats have been released.");
            document.getElementById('checkout-modal').style.display = 'none';
            fetchAndRenderDashboard();
        }
    }, 1000);
}

// Build 6 Card Validation Verification Logic Block
document.getElementById('submit-payment-btn').addEventListener('click', () => {
    const cardNumber = document.getElementById('card-number').value;
    const errorDisplay = document.getElementById('payment-error');
    
    // Core check out metric: simple simulation validation matching card string sequences
    if (cardNumber.includes('4242')) {
        clearInterval(countdownInterval);
        alert(`🎉 Payment Confirmed Successfully!\nYour tickets are secured under reference code: ${currentActiveBookingRef}`);
        document.getElementById('checkout-modal').style.display = 'none';
        document.getElementById('card-number').value = '';
        document.getElementById('card-holder').value = '';
        fetchAndRenderDashboard(); // Refresh counts from live storage file entries
    } else {
        // Declined card workflow scenario: shows error message, preserves ticket lock state, lets you retry
        errorDisplay.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', fetchAndRenderDashboard);
