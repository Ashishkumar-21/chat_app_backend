import Message from "../models/message.model.js";

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 }) // latest first
      .limit(limit)
      .skip((page - 1) * limit);

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};