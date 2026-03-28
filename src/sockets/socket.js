import jwt from "jsonwebtoken";
import mongoose from "mongoose"; // 🔥 Added to generate IDs manually
import redis from "../config/redis.js";
import Message from "../models/message.model.js";

export const initSocket = (io) => {
  io.on("connection", async (socket) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // 🔥 Store user in Redis
      await redis.set(`user:${userId}`, socket.id);
      
      const onlineUsers = await redis.keys("user:*");
      io.emit("online_users", onlineUsers.map((u) => u.split(":")[1]));

      console.log(`✅ User connected: ${userId} → ${socket.id}`);

      // 🔥 MESSAGE EVENT (Optimized for Redis)
      socket.on("send_message", async (data) => {
        const { chatId, receiverId, content } = data;
        
        // 1. Manually generate a MongoDB ID
        const messageId = new mongoose.Types.ObjectId();
        
        // 2. Check if receiver is online
        const receiverSocket = await redis.get(`user:${receiverId}`);
        const status = receiverSocket ? "delivered" : "sent";

        // 3. Create the message object
        const newMessage = {
          _id: messageId,
          chatId,
          sender: userId,
          content,
          status,
          createdAt: new Date(),
        };

        // 4. Instantly send to receiver (Real-time)
        if (receiverSocket) {
          io.to(receiverSocket).emit("receive_message", newMessage);
        }
        
        // Instantly send back to sender
        socket.emit("receive_message", newMessage);

        // 5. 🔥 Push to Redis Queue instead of MongoDB
        await redis.rpush("message_queue", JSON.stringify(newMessage));
        // 🔥 NEW: Delete the cached page 1 for this chat so it forces a fresh fetch next time!
        await redis.del(`chat_history:${chatId}:page:1`);
        
        // Optional: Cache recent chat history in Redis for super fast initial loading
        await redis.lpush(`chat_history:${chatId}`, JSON.stringify(newMessage));
        await redis.ltrim(`chat_history:${chatId}`, 0, 49); // Keep only last 50 messages in cache
        // 🔥 Push to Redis Queue instead of MongoDB (From our previous step)
        
      });

      socket.on("typing", async ({ receiverId }) => {
        const receiverSocket = await redis.get(`user:${receiverId}`);
        if (receiverSocket) {
          io.to(receiverSocket).emit("typing", { userId });
        }
      });

      socket.on("mark_read", async ({ messageId }) => {
        // Find message and update in DB
        const message = await Message.findById(messageId);
        if (!message) return;

        message.status = "read";
        await message.save();

        const senderSocket = await redis.get(`user:${message.sender}`);
        if (senderSocket) {
          io.to(senderSocket).emit("message_read", { messageId });
        }
      });

      // DISCONNECT
      socket.on("disconnect", async () => {
        await redis.del(`user:${userId}`);
        const onlineUsers = await redis.keys("user:*");
        io.emit("online_users", onlineUsers.map((u) => u.split(":")[1]));
        console.log(`❌ User disconnected: ${userId}`);
      });
    } catch (err) {
      socket.disconnect();
    }
  });
};