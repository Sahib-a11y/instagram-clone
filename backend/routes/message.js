// backend/routes/messages.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Apply auth middleware to all routes
router.use(authMiddleware);

// Send a new message
router.post('/', [
  body('chatId').isMongoId().withMessage('Invalid chat ID'),
  body('content').trim().notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message too long (max 2000 characters)'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'audio', 'video'])
    .withMessage('Invalid message type'),
  body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID'),
  body('tempId').optional().isString().withMessage('Temp ID must be a string')
], handleValidationErrors, messageController.sendMessage);

// Get messages for a chat
router.get('/chat/:chatId', [
  param('chatId').isMongoId().withMessage('Invalid chat ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('before').optional().isISO8601().withMessage('Before must be a valid date')
], handleValidationErrors, messageController.getMessages);

// Edit a message
router.put('/:messageId', [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('content').trim().notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message too long (max 2000 characters)')
], handleValidationErrors, messageController.editMessage);

// Delete a message
router.delete('/:messageId', [
  param('messageId').isMongoId().withMessage('Invalid message ID')
], handleValidationErrors, messageController.deleteMessage);

// React to a message
router.post('/:messageId/react', [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('emoji').notEmpty().withMessage('Emoji is required')
    .isLength({ max: 10 }).withMessage('Emoji too long')
], handleValidationErrors, messageController.reactToMessage);

// Search messages in a chat
router.get('/chat/:chatId/search', [
  param('chatId').isMongoId().withMessage('Invalid chat ID'),
  query('query').trim().notEmpty().withMessage('Search query is required')
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, messageController.searchMessages);

// Get unread message count for user
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user.id;
    const Chat = require('../models/Chat');
    const Message = require('../models/Message');

    // Get all user's chats
    const userChats = await Chat.find({ participants: userId }).select('_id');
    const chatIds = userChats.map(chat => chat._id);

    // Count unread messages across all chats
    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
      isDeleted: { $ne: true }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark messages as read
router.post('/mark-read', [
  body('chatId').isMongoId().withMessage('Invalid chat ID'),
  body('messageIds').isArray().withMessage('Message IDs must be an array'),
  body('messageIds.*').isMongoId().withMessage('Invalid message ID in array')
], handleValidationErrors, async (req, res) => {
  try {
    const { chatId, messageIds } = req.body;
    const userId = req.user.id;

    const Chat = require('../models/Chat');
    const Message = require('../models/Message');
    const { getSocketInstance } = require('../socket/socketServer');

    // Verify user is part of the chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update messages
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        chat: chatId,
        'readBy.user': { $ne: userId }
      },
      { 
        $push: { 
          readBy: { user: userId, readAt: new Date() }
        }
      }
    );

    // Emit read receipts
    const io = getSocketInstance();
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        io.to(`user_${participantId}`).emit('messagesRead', {
          chatId,
          readBy: userId,
          messageIds
        });
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get message details
router.get('/:messageId', [
  param('messageId').isMongoId().withMessage('Invalid message ID')
], handleValidationErrors, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const Message = require('../models/Message');
    
    const message = await Message.findById(messageId)
      .populate('sender', 'username avatar isOnline')
      .populate('chat', 'participants')
      .populate({
        path: 'replyTo',
        select: 'content sender messageType',
        populate: { path: 'sender', select: 'username' }
      })
      .populate('reactions.user', 'username');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is part of the chat
    const isParticipant = message.chat.participants.some(p => p.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ message });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ error: 'Failed to get message' });
  }
});

module.exports = router;