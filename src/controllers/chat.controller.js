import Chat from "../models/chat.model.js";
import User from "../models/user.model.js"; // 🔥 1. Don't forget to import the User model!

// Create or get 1:1 chat using an EMAIL
export const createChat = async (req, res) => {
  try {
    const { email } = req.body; // 🔥 2. Accept email instead of userId
    const currentUser = req.user.userId;

    // 🔥 3. Find the user by their email
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: "No user found with this email!" });
    }

    const targetUserId = targetUser._id;

    // Optional: Prevent user from creating a chat with themselves
    if (targetUserId.toString() === currentUser.toString()) {
        return res.status(400).json({ message: "You cannot create a chat with yourself!" });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [currentUser, targetUserId] },
    }).populate("participants", "name email"); // Populate so frontend has the names immediately

    if (chat) {
      return res.status(200).json(chat);
    }

    // Else Create new chat
    chat = await Chat.create({
      participants: [currentUser, targetUserId],
    });

    // Populate the newly created chat before sending to frontend
    chat = await chat.populate("participants", "name email");

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all chats for logged-in user (Keep this exactly as it is)
export const getChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({
      participants: userId,
    }).populate("participants", "name email");

    res.status(200).json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};