import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import messageRoutes from "./routes/message.routes.js";



const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes); 
app.use("/api/chat", chatRoutes);
app.use("/api/messages", messageRoutes);

// Health route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;