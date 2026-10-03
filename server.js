const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

// ---- Structured logging -------------------------------------------
// One JSON object per line on stdout. Kubernetes writes stdout to a file
// on the node, and Promtail reads it from there. Nothing to configure.
function log(level, msg, fields = {}) {
  process.stdout.write(JSON.stringify({
    ts: new Date().toISOString(),
    level,                 // info | warn | error | fatal
    service: 'portal',
    msg,
    ...fields,
  }) + '\n');
}
 
// ---- Metrics ------------------------------------------------------
const client = require('prom-client');
const register = new client.Registry();
 
// Node.js process metrics: memory, CPU, event loop lag, garbage collection
client.collectDefaultMetrics({ register });
 
const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});
 
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});
 
// One pass through a request produces a metric and a log line
app.use((req, res, next) => {
  const started = Date.now();
  const done = httpDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : 'static',
      status: res.statusCode,
    };
    httpRequests.inc(labels);
    done(labels);
    log(res.statusCode >= 500 ? 'error' : 'info', 'request', {
      ...labels,
      duration_ms: Date.now() - started,
    });
  });
  next();
});
 
// The endpoint Prometheus scrapes. MUST be above app.get('*').
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Serve all files in web/ as static assets
app.use(express.static(path.join(__dirname, 'web')));

const fetch = require('node-fetch');

// Proxy /api/status to the payment API container
// In Docker Compose, 'api' resolves to the payment-api container's IP
const API_URL = process.env.API_URL; 

const FALLBACK_STATUS = {
    lastUpdated: new Date().toISOString(),
    overall: 'operational',
    services: [
        { name: 'Payment API',   status: 'operational', uptime: '99.98%' },
        { name: 'Verve Network', status: 'operational', uptime: '99.95%' },
        { name: 'Settlement',    status: 'operational', uptime: '99.97%' },
    ]
};

app.get('/api/status', async (req, res) => {
    // standalone mode - no payment API configured
    if (!API_URL) return res.json(FALLBACK_STATUS);

    try {
        const upstream = await fetch(`${API_URL}/status`);
        res.json(await upstream.json());
    } catch (err) {
        // API down: degrade, do not crash
        res.json(FALLBACK_STATUS);
    }
});

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

// Real applications are not ready the instant the process starts. This
// makes that delay visible so you can measure what a probe is worth.
const BOOT_DELAY_MS = Number(process.env.BOOT_DELAY_MS || 0);
log('info', 'starting portal', { boot_delay_ms: BOOT_DELAY_MS });
setTimeout(() => {
    app.listen(PORT, () => log('info', 'portal listening', { port: PORT }));
}, BOOT_DELAY_MS);
 
// A crash that prints nothing is a crash nobody can investigate.
// JSON.stringify escapes the newlines, so the stack stays on one line.
process.on('uncaughtException', (err) => {
  log('fatal', 'uncaught exception', { err: err.message, stack: err.stack });
  process.exit(1);
});
 
// Kubernetes sends SIGTERM before it removes a Pod. Saying so turns a
// mysterious restart into an ordinary, explained one.
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down');
  process.exit(0);
});