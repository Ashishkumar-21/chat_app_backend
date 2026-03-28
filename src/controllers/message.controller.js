import Message from "../models/message.model.js";
import redis from "../config/redis.js"; // 🔥 Import Redis

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    // 🔥 1. Create a unique cache key for this specific chat and page
    const cacheKey = `chat_history:${chatId}:page:${page}`;

    // 🔥 2. Check if we already have this in Redis
    const cachedMessages = await redis.get(cacheKey);

    if (cachedMessages) {
      // console.log("⚡ Serving from Redis Cache"); // Uncomment to test
      return res.status(200).json(JSON.parse(cachedMessages));
    }

    // 🐢 3. If NOT in Redis, fetch from MongoDB
    // console.log("🐢 Serving from MongoDB"); // Uncomment to test
    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 }) // latest first
      .limit(limit)
      .skip((page - 1) * limit);

    // 🔥 4. Save the result to Redis for the next time!
    // We set an expiration ("EX") of 3600 seconds (1 hour) so stale data doesn't sit in memory forever
    if (messages.length > 0) {
      await redis.set(cacheKey, JSON.stringify(messages), "EX", 3600);
    }

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};