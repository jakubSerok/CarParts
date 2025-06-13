const express = require('express');
const router = express.Router();
const { authenticate } = require('../controllers/userController');
const {
  getUserConversations,
  getConversationMessages,
  createConversation,
  sendMessage,
  getAllUsers
} = require('../controllers/chatController');

// Apply authentication middleware to all chat routes
router.use(authenticate);

// Get all conversations for the authenticated user
router.get('/conversations', getUserConversations);

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', getConversationMessages);

// Create a new conversation
router.post('/conversations', createConversation);

// Send a message in a conversation
router.post('/messages', sendMessage);

// Get all users (for creating new conversations)
router.get('/users', getAllUsers);

module.exports = router;
