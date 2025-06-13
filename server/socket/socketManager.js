const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Map to store active user connections
const activeUsers = new Map();

const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.userId = user._id.toString();
      socket.user = {
        _id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);
    
    // Add user to active users map
    activeUsers.set(socket.userId, socket.id);
    
    // Emit online users to all connected clients
    io.emit('users:online', Array.from(activeUsers.keys()));

    // Join user to their conversation rooms
    socket.on('join:conversations', async () => {
      try {
        const user = await User.findById(socket.userId).populate('conversations');
        
        if (user && user.conversations) {
          user.conversations.forEach(conversation => {
            socket.join(`conversation:${conversation._id}`);
          });
        }
      } catch (error) {
        console.error('Error joining conversation rooms:', error);
      }
    });

    // Handle new message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content } = data;
        
        // Verify user is part of the conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.userId
        });
        
        if (!conversation) {
          socket.emit('error', { message: 'Access denied to this conversation' });
          return;
        }
        
        // Create and save new message
        const newMessage = new Message({
          sender: socket.userId,
          content,
          conversation: conversationId
        });
        
        await newMessage.save();
        
        // Update conversation's lastMessage timestamp
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: Date.now()
        });
        
        // Populate sender information
        const populatedMessage = await Message.findById(newMessage._id)
          .populate({
            path: 'sender',
            select: 'username firstName lastName role'
          });
        
        // Emit message to all users in the conversation
        io.to(`conversation:${conversationId}`).emit('message:received', populatedMessage);
        
        // Notify other participants about new message
        conversation.participants.forEach(participantId => {
          const participantIdStr = participantId.toString();
          if (participantIdStr !== socket.userId) {
            const socketId = activeUsers.get(participantIdStr);
            if (socketId) {
              io.to(socketId).emit('notification:message', {
                conversationId,
                message: populatedMessage
              });
            }
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle read messages
    socket.on('messages:read', async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { 
            conversation: conversationId, 
            sender: { $ne: socket.userId }, 
            read: false 
          },
          { read: true }
        );
        
        // Notify other participants that messages have been read
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.participants.forEach(participantId => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== socket.userId) {
              const socketId = activeUsers.get(participantIdStr);
              if (socketId) {
                io.to(socketId).emit('messages:marked-read', {
                  conversationId,
                  readBy: socket.userId
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle user typing
    socket.on('user:typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user:typing', {
        conversationId,
        userId: socket.userId
      });
    });

    // Handle user stop typing
    socket.on('user:stop-typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user:stop-typing', {
        conversationId,
        userId: socket.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Remove user from active users map
      activeUsers.delete(socket.userId);
      
      // Emit updated online users list
      io.emit('users:online', Array.from(activeUsers.keys()));
    });
  });

  return io;
};

module.exports = { initializeSocket };
