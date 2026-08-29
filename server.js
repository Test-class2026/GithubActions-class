const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

// Serve all files in web/ as static assets
app.use(express.static(path.join(__dirname, 'web')));

const fetch = require('node-fetch');

// Proxy /api/status to the payment API container
// In Docker Compose, 'api' resolves to the payment-api container's IP
const API_URL = process.env.API_URL; 

const FALLBACK_STATUS = {
lastUpdated: new Date().toISOString(), overall: 'operational', 
services: [
{ name: 'Payment API',	status: 'operational', uptime: '99.98%' }, 
{ name: 'Verve Network', status: 'operational', uptime: '99.95%' }, 
{ name: 'Settlement',	status: 'operational', uptime: '99.97%' }, 
]
}; 

app.get('/api/status', async (req, res) = > {
if (!API_URL) return res.json(FALLBACK_STATUS);	// standalone mode try {
const upstream = await fetch(`${API_URL}/status`); res.json(await upstream.json()); 
} catch (err) {
res.json(FALLBACK_STATUS);	// API down: degrade, do not crash 
}
})

app.get('/api/health', async (req, res) => {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data     = await response.json();
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Payment API unavailable' });
    }
});

// Any unknown route returns index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Interswitch Portal running on port ${PORT}`);
    console.log(`Open: http://localhost:${PORT}`);
});