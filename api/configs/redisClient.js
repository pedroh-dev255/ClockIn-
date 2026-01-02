const Redis = require('ioredis');

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: times => Math.min(times * 50, 2000)
});

redis.on('connect', () => {
    console.log('🟢 Redis conectado');
});

redis.on('error', err => {
    console.error('🔴 Erro Redis:', err);
});

module.exports = redis;
