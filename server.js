const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoints
app.get('/', (req, res) => {
    res.json({
        service: 'VoltstoneBot API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// API routes for future expansion
app.get('/api/stats', (req, res) => {
    res.json({
        totalUsers: 0,
        totalDeposits: 0,
        totalInvestments: 0,
        apy: config.ANNUAL_PERCENTAGE_YIELD
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found'
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`API server running on port ${PORT}`);
});

module.exports = app;
