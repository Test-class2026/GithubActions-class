// ================================================
// Interswitch Mock Payment Status API
// Returns the operational status of payment services
// ================================================
const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 4000;

// Allow the portal container to call this API
app.use(cors());
app.use(express.json());

// --- Service status data ---
// In a real system this would query a database or monitoring system.
// Here we simulate it with an in-memory object.
const serviceStatus = {
    lastUpdated: new Date().toISOString(),
    overall: 'operational',
    services: [
        { name: 'Payment API',          status: 'operational', uptime: '99.98%', latency: '45ms'  },
        { name: 'Verve Network',         status: 'operational', uptime: '99.95%', latency: '120ms' },
        { name: 'Merchant Portal',       status: 'operational', uptime: '99.99%', latency: '32ms'  },
        { name: 'Settlement Engine',     status: 'operational', uptime: '99.97%', latency: '88ms'  },
        { name: 'Fraud Detection',       status: 'operational', uptime: '99.96%', latency: '210ms' },
        { name: 'Notification Service',  status: 'maintenance', uptime: '98.50%', latency: 'N/A'   },
    ]
};

// --- Routes ---

// GET /status — returns all service statuses
app.get('/status', (req, res) => {
    // Update the timestamp on each call to show it's live data
    serviceStatus.lastUpdated = new Date().toISOString();
    res.json(serviceStatus);
});

// GET /health — simple health check endpoint for Docker and load balancers
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'payment-api', timestamp: new Date().toISOString() });
});

// GET / — API information
app.get('/', (req, res) => {
    res.json({
        name: 'Interswitch Payment Status API',
        version: '1.0.0',
        endpoints: ['/status', '/health']
    });
});

app.listen(PORT, () => {
    console.log(`Payment API running on port ${PORT}`);
    console.log(`Status endpoint: http://localhost:${PORT}/status`);
});