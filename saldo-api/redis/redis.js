const Redis = require('ioredis');

const redis = new Redis({
    host: 'localhost',
    port: 6379
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