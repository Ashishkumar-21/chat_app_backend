import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./sockets/socket.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "https://chatt-app-q7ow.onrender.com",
        methods: ["GET", "POST"]
    },
});

initSocket(io);

// Connect DB first
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    httpServer.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(" DB Connection Failed:", err);
  });
