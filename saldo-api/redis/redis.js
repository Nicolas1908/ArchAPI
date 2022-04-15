const Redis = require('ioredis');


const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

async function get(key) {
    const value = await redis.get(key);

    return value ? JSON.parse(value) : null
}

async function set(key, value) {
    return redis.set(key, JSON.stringify(value));
}

module.exports = {
    get,
    set
};