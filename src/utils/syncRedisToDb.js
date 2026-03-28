import redis from "../config/redis.js";
import Message from "../models/message.model.js";

// This function will pull messages from Redis and save them to MongoDB in bulk
export const startMessageSync = () => {
  // Runs every 5 seconds
  setInterval(async () => {
    try {
      // 1. Get all messages currently in the queue
      const messages = await redis.lrange("message_queue", 0, -1);
      
      if (messages.length === 0) return;

      // 2. Parse stringified messages back into objects
      const parsedMessages = messages.map((msg) => JSON.parse(msg));

      // 3. Bulk insert them into MongoDB! (One database operation instead of many)
      await Message.insertMany(parsedMessages);

      // 4. Remove the inserted messages from the Redis queue
      await redis.ltrim("message_queue", messages.length, -1);
      
      console.log(`✅ Synced ${messages.length} messages to MongoDB`);
    } catch (error) {
      console.error("❌ Failed to sync Redis queue to MongoDB:", error);
    }
  }, 5000); // 5000ms = 5 seconds
};