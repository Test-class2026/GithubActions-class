// Live clock — updates every second
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// Animated stat counters
function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const step   = target / (2000 / 16);
    let current  = 0;
    const timer  = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current).toLocaleString();
    }, 16);
}
document.querySelectorAll('.counter').forEach(animateCounter);

// --- LIVE SYSTEM STATUS (fetched from Payment API) ---
// The API_URL comes from the window object, set by the server.
// In Docker: portal calls http://api:4000/status (internal network)
// In browser: the portal SERVER fetches the data, not the browser directly.
// For simplicity in this lab, we fetch from the API via the portal's proxy endpoint.

async function loadSystemStatus() {
    const grid = document.getElementById('statusGrid');
    grid.innerHTML = '<p style="color:#777">Loading status...</p>';

    try {
        // Call the portal's own /api/status route (which proxies to the payment API)
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        grid.innerHTML = '';

        // Show the last updated time
        const updated = document.createElement('p');
        updated.style.cssText = 'color:#777;font-size:0.85rem;margin-bottom:16px;grid-column:1/-1;';
        updated.textContent = `Last updated: ${new Date(data.lastUpdated).toLocaleTimeString()}`;
        grid.appendChild(updated);

        // Render each service card
        data.services.forEach(service => {
            const card = document.createElement('div');
            card.className = `status-card ${service.status}`;
            card.innerHTML = `
                <div>
                    <span class="service-name">${service.name}</span>
                    <span class="service-meta">Uptime: ${service.uptime} | Latency: ${service.latency}</span>
                </div>
                <span class="service-status">
                    ${service.status === 'operational' ? '✔ Operational' : '⚠ Maintenance'}
                </span>`;
            grid.appendChild(card);
        });

    } catch (err) {
        grid.innerHTML = `<p style="color:#C62828">Could not load status: ${err.message}.</p>`;
    }
}

// Load status on page load, then refresh every 30 seconds
loadSystemStatus();
setInterval(loadSystemStatus, 30000);

// Form validation
function submitForm() {
    const name = document.getElementById('businessName').value.trim();
    const rc   = document.getElementById('rcNumber').value.trim();
    const email= document.getElementById('email').value.trim();
    const type = document.getElementById('businessType').value;
    const msg  = document.getElementById('formMessage');
    if (!name||!rc||!email||!type) {
        msg.className='form-message error';
        msg.textContent='Please fill in all fields before submitting.';
        return;
    }
    if (!email.includes('@')||!email.includes('.')) {
        msg.className='form-message error';
        msg.textContent='Please enter a valid email address.';
        return;
    }
    msg.className='form-message success';
    msg.textContent=`Application received for ${name}. We will contact ${email} within 2 business days.`;
}