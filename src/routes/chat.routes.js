import express from "express";
import { createChat, getChats } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createChat);
router.get("/", protect, getChats);

export default router;