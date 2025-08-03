const dotenv = require('dotenv');
dotenv.config();

const config = {
    // Bot Configuration
    BOT_TOKEN: process.env.BOT_TOKEN || '7808081125:AAHQZX-JvsJtqRzoKXWwvnO1XFOcTb1ghlk',
    ADMIN_ID: process.env.ADMIN_ID || '5608086275',
    
    // Wallet Configuration
    WALLET_ADDRESS: process.env.WALLET_ADDRESS || 'TVmzjRPgjYt7c1E59z6AtG9U2kZYKex4JZ',
    
    // Investment Configuration
    ANNUAL_PERCENTAGE_YIELD: parseFloat(process.env.APY) || 20.0,
    MINIMUM_DEPOSIT: parseFloat(process.env.MIN_DEPOSIT) || 10.0,
    MAXIMUM_DEPOSIT: parseFloat(process.env.MAX_DEPOSIT) || 100000.0,
    
    // Server Configuration
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'production',
    
    // Security Configuration
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    
    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Features
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
    WITHDRAWAL_ENABLED: process.env.WITHDRAWAL_ENABLED !== 'false',
    
    // Messages
    SUPPORT_USERNAME: process.env.SUPPORT_USERNAME || 'VoltstoneSupport',
    CHANNEL_USERNAME: process.env.CHANNEL_USERNAME || 'VoltstoneChannel'
};

// Validation
if (!config.BOT_TOKEN) {
    throw new Error('BOT_TOKEN is required');
}

if (!config.ADMIN_ID) {
    throw new Error('ADMIN_ID is required');
}

if (!config.WALLET_ADDRESS) {
    throw new Error('WALLET_ADDRESS is required');
}

module.exports = config;