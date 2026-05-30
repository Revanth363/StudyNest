const { Redis } = require("@upstash/redis");

let redis;

const connectRedis = async () => {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });

    // Test connection
    await redis.ping();
    console.log("Upstash Redis Connected");
  } catch (error) {
    console.error(`Redis connection error: ${error.message}`);
    process.exit(1);
  }
};

const getRedis = () => {
  if (!redis) {
    throw new Error("Redis not initialized. Call connectRedis first.");
  }
  return redis;
};

module.exports = { connectRedis, getRedis };