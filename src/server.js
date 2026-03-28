import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./sockets/socket.js";

// 🔥 1. Import the sync function
import { startMessageSync } from "./utils/syncRedisToDb.js"; 

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-app-backend-74cm.onrender.com"
    ],
    methods: ["GET", "POST"]
  },
});

initSocket(io);

// Connect DB first
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      
      // 🔥 2. Start the background sync worker AFTER the DB connects
      startMessageSync(); 
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Failed:", err);
  });