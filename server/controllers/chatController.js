const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Get all conversations for a user
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'username firstName lastName role'
      })
      .sort({ lastMessage: -1 });
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get messages for a specific conversation
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const messages = await Message.find({ conversation: conversationId })
      .populate({
        path: 'sender',
        select: 'username firstName lastName role'
      })
      .sort({ timestamp: 1 });
    
    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, read: false },
      { read: true }
    );
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new conversation
const createConversation = async (req, res) => {
  try {
    const { participantIds, title } = req.body;
    const userId = req.user._id;
    
    // Ensure current user is included in participants
    const allParticipants = [...new Set([...participantIds, userId.toString()])];
    
    // Validate all participants exist
    const userCount = await User.countDocuments({
      _id: { $in: allParticipants }
    });
    
    if (userCount !== allParticipants.length) {
      return res.status(400).json({ message: 'One or more users not found' });
    }
    
    // Check if conversation between these users already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: allParticipants, $size: allParticipants.length }
    });
    
    if (existingConversation) {
      return res.status(200).json({ 
        message: 'Conversation already exists', 
        conversation: existingConversation 
      });
    }
    
    const newConversation = new Conversation({
      participants: allParticipants,
      title: title || ''
    });
    
    await newConversation.save();
    
    // Add conversation to each user's conversations array
    await User.updateMany(
      { _id: { $in: allParticipants } },
      { $push: { conversations: newConversation._id } }
    );
    
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate({
        path: 'participants',
        select: 'username firstName lastName role'
      });
    
    res.status(201).json(populatedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message in a conversation
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user._id;
    
    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const newMessage = new Message({
      sender: userId,
      content,
      conversation: conversationId
    });
    
    await newMessage.save();
    
    // Update conversation's lastMessage timestamp
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: Date.now()
    });
    
    const populatedMessage = await Message.findById(newMessage._id)
      .populate({
        path: 'sender',
        select: 'username firstName lastName role'
      });
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (for creating new conversations)
const getAllUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const users = await User.find({ _id: { $ne: userId } })
      .select('username firstName lastName role');
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserConversations,
  getConversationMessages,
  createConversation,
  sendMessage,
  getAllUsers
};
