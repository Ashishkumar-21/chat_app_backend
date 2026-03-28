import Chat from "../models/chat.model.js";

// Create or get 1:1 chat
export const createChat = async (req, res) => {
  try {
    const { userId } = req.body; // other user
    const currentUser = req.user.userId;

    // Check if chat already exists
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [currentUser, userId] },
    });

    if (chat) {
      return res.status(200).json(chat);
    }

    //Else Create new chat
    chat = await Chat.create({
      participants: [currentUser, userId],
    });

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all chats for logged-in user
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