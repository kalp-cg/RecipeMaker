require('dotenv').config();
const express = require('express');
const cors = require('cors');
const recipeRoutes = require('./routes/recipe');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Middleware ───
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '1mb' }));  // Prevent huge payloads
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Simple rate limiter (in-memory, per IP) ───
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;           // max requests per window for /generate-recipe

app.use('/api/generate-recipe', (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const entry = requestCounts.get(ip);

    if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
        requestCounts.set(ip, { start: now, count: 1 });
        return next();
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please wait a minute before generating another recipe.',
        });
    }
    next();
});

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of requestCounts.entries()) {
        if (now - entry.start > RATE_LIMIT_WINDOW * 2) requestCounts.delete(ip);
    }
}, 5 * 60 * 1000);

// ─── Request Logging ───
app.use((req, res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

// ─── Routes ───
app.use('/api', recipeRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AI Recipe Maker API',
        version: '2.1.0',
        endpoints: {
            health: 'GET /api/health',
            generateRecipe: 'POST /api/generate-recipe',
            randomImages: 'GET /api/random-images',
        },
    });
});

// ─── 404 ───
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ───
app.use((err, req, res, _next) => {
    console.error('[server] Unhandled error:', err.stack || err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ───
app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║     🍳 AI Recipe Maker v2.1          ║');
    console.log('  ╠══════════════════════════════════════╣');
    console.log(`  ║  Server  → http://localhost:${PORT}      ║`);
    console.log(`  ║  Ollama  → ${(process.env.OLLAMA_API_URL || 'http://localhost:11434').padEnd(24)} ║`);
    console.log(`  ║  Model   → ${(process.env.OLLAMA_MODEL || 'llama2:latest').padEnd(24)} ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
});

module.exports = app;
