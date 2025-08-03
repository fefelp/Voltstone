const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const config = require('./config/config');
const logger = require('./utils/logger');
const messageHandler = require('./handlers/messageHandler');
const commandHandler = require('./handlers/commandHandler');

// Initialize Express app for health checks (required for Render)
const app = express();
const PORT = process.env.PORT || 5000;

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'VoltstoneBot is running', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', bot: 'active' });
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Health check server running on port ${PORT}`);
});

// Initialize Telegram Bot
let bot;

try {
    bot = new TelegramBot(config.BOT_TOKEN, { 
        polling: {
            interval: 1000,
            autoStart: true,
            params: {
                timeout: 10
            }
        }
    });

    logger.info('VoltstoneBot initialized successfully');
    
    // Bot event handlers
    bot.on('polling_error', (error) => {
        logger.error('Polling error:', error);
    });

    bot.on('error', (error) => {
        logger.error('Bot error:', error);
    });

    // Command handlers
    commandHandler.setupCommands(bot);
    
    // Message handlers
    messageHandler.setupMessageHandlers(bot);

    logger.info('VoltstoneBot is now running...');

} catch (error) {
    logger.error('Failed to initialize bot:', error);
    process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Shutting down VoltstoneBot...');
    if (bot) {
        bot.stopPolling();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down VoltstoneBot...');
    if (bot) {
        bot.stopPolling();
    }
    process.exit(0);
});

module.exports = { bot, app };
