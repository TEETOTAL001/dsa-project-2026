// public/app.js

let sessionToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let isLoginMode = true;
let countdownInterval = null;
let currentActiveBookingRef = null;

// Global view management utility
window.switchView = function(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeSection = document.getElementById(viewId);
    if (activeSection) activeSection.classList.add('active');

    if (viewId === 'browse-view') fetchAndRenderDashboard();
    if (viewId === 'attendee-view') fetchMyTicketsDashboard();
    if (viewId === 'organizer-view') fetchOrganizerManagementDashboard();
};

// 1. Browsing Pipeline Engine
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
                return `<option value="${t.name}" ${isSoldOut ? 'disabled' : ''}>
                    ${t.name} — $${(t.priceInCents / 100).toFixed(2)} (${isSoldOut ? 'SOLD OUT' : `${t.capacity - t.ticketsSold} left`})
                </option>`;
            }).join('');

            card.innerHTML = `
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <strong>📍 Location:</strong> ${event.city}<br>
                    <strong>🏟️ Venue:</strong> ${event.venue}<br>
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
        displayContainer.innerHTML = `<p style="color: red;">Network communication failure: ${err.message}</p>`;
    }
}

// 2. Authentication Pipeline Engine
window.toggleAuthMode = function(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? 'Sign In to Your Account' : 'Create Free Secure Account';
    document.getElementById('auth-submit-btn').innerText = isLoginMode ? 'Log In' : 'Register Account';
    document.getElementById('signup-role-group').style.display = isLoginMode ? 'none' : 'block';
    document.getElementById('auth-toggle-link').innerText = isLoginMode ? "Don't have an account? Sign Up now" : "Already have an account? Login here";
};

window.submitAuthForm = async function() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const role = document.getElementById('auth-role').value;

    if (!email || !password) return alert('Please enter both email and password paths');

    const url = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLoginMode ? { email, password } : { email, password, role };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!data.success) return alert(`❌ Access Denied: ${data.message}`);

        if (isLoginMode) {
            sessionToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', sessionToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            alert(`🔑 Welcome Back, ${currentUser.email}!`);
            syncSecurityInterfaceLayout();
            switchView('browse-view');
        } else {
            alert('🎉 Registration Successful! Please log in with your credentials.');
            isLoginMode = true;
            toggleAuthMode({ preventDefault: () => {} });
        }
    } catch (err) {
        alert(`Authentication Error: ${err.message}`);
    }
};

function syncSecurityInterfaceLayout() {
    const statusText = document.getElementById('user-status-text');
    const loginBtn = document.getElementById('nav-login-btn');
    const logoutBtn = document.getElementById('nav-logout-btn');
    const navBar = document.getElementById('navigation-bar');

    document.querySelectorAll('.role-nav-tab').forEach(t => t.remove());

    if (sessionToken && currentUser) {
        statusText.innerText = `User: ${currentUser.email} (${currentUser.role})`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';

        if (currentUser.role === 'Attendee') {
            const btn = document.createElement('button');
            btn.className = 'role-nav-tab';
            btn.innerHTML = '🎫 My Tickets';
            btn.onclick = () => switchView('attendee-view');
            navBar.insertBefore(btn, logoutBtn);
        } else if (currentUser.role === 'Organizer') {
            const btn = document.createElement('button');
            btn.className = 'role-nav-tab';
            btn.innerHTML = '⚙️ Organizer Dash';
            btn.onclick = () => switchView('organizer-view');
            navBar.insertBefore(btn, logoutBtn);
        }
    } else {
        statusText.innerText = 'Role: Guest Visitor';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

window.logoutSession = function() {
    sessionToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    alert('🚪 Successfully logged out of session.');
    syncSecurityInterfaceLayout();
    switchView('browse-view');
};

async function fetchMyTicketsDashboard() {
    const tbody = document.getElementById('tickets-display-body');
    try {
        const response = await fetch('/api/my-tickets', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const data = await response.json();

        if (!data.success) return tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${data.message}</td></tr>`;
        if (data.results.length === 0) return tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No tickets booked yet.</td></tr>`;

        tbody.innerHTML = data.results.map(b => `
            <tr>
                <td><strong>${b.reference_code}</strong></td>
                <td>${b.title}</td>
                <td>${b.venue}</td>
                <td>${b.startsAt}</td>
                <td>${b.quantity}</td>
                <td style="color:${b.status === 'PAID' ? '#2ecc71' : '#f39c12'}; font-weight:bold;">${b.status}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Connection failure: ${err.message}</td></tr>`;
    }
}

async function fetchOrganizerManagementDashboard() {
    const tbody = document.getElementById('organizer-events-body');
    try {
        const response = await fetch('/api/organizer/dashboard', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        const data = await response.json();

        if (!data.success) return tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${data.message}</td></tr>`;
        if (data.results.length === 0) return tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No authored programs managed.</td></tr>`;

        tbody.innerHTML = data.results.map(e => `
            <tr>
                <td><code>${e.id}</code></td>
                <td><strong>${e.title}</strong></td>
                <td>${e.venue}</td>
                <td>${e.city}</td>
                <td>${e.startsAt}</td>
                <td><span style="background-color:#2ecc71; color:white; padding:3px 8px; border-radius:4px; font-size:0.85em;">${e.status}</span></td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Connection failure: ${err.message}</td></tr>`;
    }
}

window.openCreateEventModal = function() {
    document.getElementById('event-modal').style.display = 'flex';
};

window.submitCreateEventForm = async function() {
    const id = document.getElementById('evt-id').value;
    const title = document.getElementById('evt-title').value;
    const venue = document.getElementById('evt-venue').value;
    const city = document.getElementById('evt-city').value;
    const startsAt = document.getElementById('evt-date').value;
    const price = parseInt(document.getElementById('evt-tier-price').value, 10);
    const capacity = parseInt(document.getElementById('evt-tier-cap').value, 10);

    if (!id || !title || !venue || !city || !startsAt) return alert('Please satisfy all layout forms criteria fields');

    const eventPayload = {
        id, title, venue, city, startsAt,
        tiers: [{ name: 'Standard General', priceInCents: price, capacity: capacity }]
    };

    try {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify(eventPayload)
        });

                const data = await response.json();
        if (data.success) {
            alert('🚀 Program Event Successfully Published Live to indexes!');
            document.getElementById('event-modal').style.display = 'none';
            fetchOrganizerManagementDashboard();
        } else {
            alert(`❌ Error publishing event: ${data.message}`);
        }
    } catch (err) {
        alert(`Server transmission crash: ${err.message}`);
    }
};

window.processLiveBooking = async function(eventId, eventTitle) {
    if (!sessionToken) return alert('⚠️ Access Restricted: Please sign in or log in to register ticket orders!');
    if (currentUser.role !== 'Attendee') return alert('⛔ Operation Blocked: Only Attendee accounts can reserve seats.');
    
    const selectedTier = document.getElementById(`tier-${eventId}`).value;
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ eventId, tierName: selectedTier, attendeeName: currentUser.email, quantity: 1 })
        });
        
        const result = await response.json();
        if (result.success) {
            currentActiveBookingRef = result.booking.referenceCode;
            launchCheckoutModal(eventTitle, selectedTier, currentUser.email);
        } else {
            alert(`❌ Reservation Denied: ${result.message || result.error}`);
        }
    } catch (err) {
        alert(`Network transmission crash: ${err.message}`);
    }
};

function launchCheckoutModal(eventTitle, tierName, attendeeName) {
    document.getElementById('booking-details-text').innerText = `Account: ${attendeeName}\nEvent: ${eventTitle} (${tierName})`;
    document.getElementById('payment-error').style.display = 'none';
    document.getElementById('checkout-modal').style.display = 'flex';
    
    let totalSeconds = 5 * 60;
    const timerDisplay = document.getElementById('timer-display');
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        totalSeconds--;
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        timerDisplay.innerText = `Time Remaining: ${minutes}:${seconds}`;
        
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            alert("⏳ Hold expired! Reserved seats released back into pool maps.");
            document.getElementById('checkout-modal').style.display = 'none';
            fetchAndRenderDashboard();
        }
    }, 1000);
}

document.getElementById('submit-payment-btn').addEventListener('click', async () => {
    const cardNumber = document.getElementById('card-number').value;
    const errorDisplay = document.getElementById('payment-error');
    
    if (cardNumber.includes('4242')) {
        clearInterval(countdownInterval);
        try {
            const response = await fetch(`/api/bookings/${currentActiveBookingRef}/pay`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            
            const data = await response.json();
            alert(`🎉 Verification Success!\nReceipt Reference Token: ${currentActiveBookingRef} has status set to PAID.`);
            document.getElementById('checkout-modal').style.display = 'none';
            document.getElementById('card-number').value = '';
            fetchAndRenderDashboard();
        } catch (e) {
            alert('Payment path sync anomaly.');
        }
    } else {
        errorDisplay.style.display = 'block';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    syncSecurityInterfaceLayout();
    fetchAndRenderDashboard();
});
