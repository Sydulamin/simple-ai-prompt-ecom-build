import { createClient } from 'redis';
import logger from '../utils/logger.js';

let activeClient = null;

const redisClient = {
  get: async (key) => activeClient ? activeClient.get(key) : null,
  setEx: async (key, seconds, value) => activeClient ? activeClient.setEx(key, seconds, value) : null,
  keys: async (pattern) => activeClient ? activeClient.keys(pattern) : [],
  del: async (keys) => activeClient ? activeClient.del(keys) : null,
};

const initRedis = async () => {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 2) return new Error('Max retries reached');
        return Math.min(retries * 50, 500);
      }
    }
  });

  client.on('error', (err) => {
    if (activeClient === client) {
      activeClient = null;
      logger.error('Redis connection failed, running in fallback mode without cache.');
    }
  });
  
  client.on('connect', () => logger.info('Connected to Redis'));

  try {
    await client.connect();
    activeClient = client;
  } catch (err) {
    logger.error('Could not connect to Redis. Caching is disabled.');
  }
};

initRedis();

export default redisClient;
