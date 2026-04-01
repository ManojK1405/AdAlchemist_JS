import { createClient } from 'redis';
import 'dotenv/config';

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
    // console.log('Redis error:', err.message);
});

let isConnected = false;

export const connectRedis = async () => {
    try {
        await client.connect();
        isConnected = true;
        console.log('✔ Redis connected successfully');
    } catch (err) {
        console.log('✖ Redis connection failed, using in-memory fallback.');
        isConnected = false;
    }
};

export const getCache = async (key) => {
    if (!isConnected) return null;
    try {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
};

export const setCache = async (key, value, duration = 30) => {
    if (!isConnected) return false;
    try {
        await client.setEx(key, duration, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
};

export const clearCache = async (key) => {
    if (!isConnected) return;
    try {
        await client.del(key);
    } catch (error) {
        // ignore
    }
}

export default client;
