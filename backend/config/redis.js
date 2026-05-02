import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Redis v5+ API - updated configuration
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.warn('Redis connection retries exhausted.');
                return new Error('Retry time exhausted');
            }
            return Math.min(retries * 100, 3000);
        },
    },
    password: process.env.REDIS_PASSWORD || undefined,
    username: 'default',
});

redisClient.on('error', (err) => {
    console.warn('[REDIS ERROR]', err.message);
});

redisClient.on('connect', () => {
    console.log('✓ Redis connected successfully');
});

redisClient.on('ready', () => {
    console.log('✓ Redis is ready');
});

redisClient.on('end', () => {
    console.log('✓ Redis connection closed');
});

// Establish connection
redisClient.connect().catch((err) => {
    console.warn('[REDIS] Connection failed:', err.message);
    console.warn('[REDIS] Cache will be disabled for this session');
});

export default redisClient;
