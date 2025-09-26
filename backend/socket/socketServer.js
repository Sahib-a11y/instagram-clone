import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

class SocketServer {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: ["http://localhost:3000"],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.users = new Map(); // userId ------> { socketId, user }
        this.typingUsers = new Map(); // conversationId -----------> Set of userIds
        
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {   ///auth middlewre
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error: No token provided'));
                }

                const decoded = jwt.verify(token, process.env.SECRETKEY);
                const user = await User.findById(decoded.id).select('-password');
                
                if (!user) {
                    return next(new Error('Authentication error: User not found'));
                }

                socket.userId = user._id.toString();
                socket.userData = user;
                next();
            } catch (error) {
                // console.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            // console.log(`User connected: ${socket.userData.name} (${socket.userId})`);
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const userId = socket.userId;
        const userData = socket.userData;

        
        this.users.set(userId, {   //connection stored of user
            socketId: socket.id, 
            user: userData,
            lastSeen: new Date()
        });

        
        await this.updateUserOnlineStatus(userId, true, socket.id);

        
        socket.join(`user_${userId}`);

        await this.broadcastOnlineStatus(userId, true);

        this.setupSocketEventHandlers(socket);
    }

    setupSocketEventHandlers(socket) {
        const userId = socket.userId;

        
        socket.on('join_conversation', async (conversationId) => {  // hndle converstion of user
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId
                });

                if (conversation) {
                    socket.join(`conversation_${conversationId}`);
                    // console.log(`User ${userId} joined conversation ${conversationId}`);
                    socket.join(`user_${userId}`);
                }else {
                    console.log(`conversation not found : ${conversationId}`);
                    
                }
            } catch (error) {
                console.error('Join conversation error:', error);
            }
        });

        
        socket.on('leave_conversation', (conversationId) => {   //handle lft conversation 
            socket.leave(`conversation_${conversationId}`);
            // console.log(`User ${userId} left conversation ${conversationId}`);
        });

        
    socket.on('send_message', async (data) => {
    try {
        const { conversationId, content, tempId } = data;
        const userId = socket.userId;

        console.log(`📤 User ${userId} sending message to conversation ${conversationId}:`, content);

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            console.error('❌ Conversation not found or access denied');
            socket.emit('message_error', { error: 'Conversation not found', tempId });
            return;
        }

        try {
            // Create message - DON'T mark as read for anyone yet
            const message = new Message({
                conversation: conversationId,
                sender: userId,
                content: content.trim(),
                isRequestMessage: conversation.isMessageRequest && !conversation.requestAccepted,
                readBy: [] // Start with empty readBy array
            });

            await message.save();
            await message.populate('sender', 'name pic');

            
            conversation.lastMessage = message._id;
            conversation.lastActivity = new Date();
            await conversation.save();

            const messageData = {
                _id: message._id,
                conversation: message.conversation,
                sender: message.sender,
                content: message.content,
                createdAt: message.createdAt,
                isRequestMessage: message.isRequestMessage,
                readBy: [] // Empty for receivers
            };
            this.io.to(`conversation_${conversationId}`).emit('new_message', {
                message: messageData,
                tempId
            });

            console.log(`📨 Message broadcasted to conversation ${conversationId}`);
            const senderMessageData = {
                ...messageData,
                readBy: [{
                    user: userId,
                    readAt: new Date()
                }]
            };
            socket.emit('new_message', {
                message: senderMessageData,
                tempId
            });

            console.log(`✅ Sent personalized message to sender ${userId}`);

        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('message_error', { error: 'Failed to save message', tempId });
        }

    } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { error: 'Failed to send message', tempId: data.tempId });
    }
});
        socket.on('typing_start', (data) => {   //hndle typing indicator
            this.handleTypingStart(socket, data);
        });

        socket.on('typing_stop', (data) => {
            this.handleTypingStop(socket, data);
        });
socket.on('mark_messages_read', async (data) => {
  try {
    const { conversationId } = data;
    const userId = socket.userId;

    console.log(`User ${userId} marking messages as read in conversation ${conversationId}`);

    // Update messages in database
    const result = await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        "readBy.user": { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    // console.log(`Updated ${result.modifiedCount} messages as read`);

    // Find the conversation to get all participants
    const conversation = await Conversation.findById(conversationId).populate('participants');
    
    if (conversation) {
      conversation.participants.forEach(participant => {
        if (participant._id.toString() !== userId) {
          this.io.to(`user_${participant._id}`).emit('messages_read', {
            conversationId: conversationId,
            readBy: userId,
            readAt: new Date()
          });
          console.log(`Notified user ${participant._id} about read status`);
        }
      });
    }

  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
});

// Add a new handler for individual message read receipts


        socket.on('disconnect', () => { //hndle disconnect
            this.handleDisconnection(socket);
        });
    }

    async handleSendMessage(socket, data) {
        const { conversationId, content, tempId } = data;
        const userId = socket.userId;

        // console.log(`User ${userId} sending message to conversation ${conversationId}:`, content);

        
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            // console.error('Conversation not found or access denied');
            socket.emit('message_error', { error: 'Conversation not found', tempId });
            return;
        }

        
        if (conversation.isMessageRequest && !conversation.requestAccepted && 
            conversation.requestFrom.toString() !== userId) {
            // console.error('Cannot send message to unaccepted request');
            socket.emit('message_error', { error: 'Cannot send message to unaccepted request', tempId });
            return;
        }

        try {
            // Create message
            const message = new Message({
                conversation: conversationId,
                sender: userId,
                content: content.trim(),
                isRequestMessage: conversation.isMessageRequest && !conversation.requestAccepted
            });

            await message.save();
            await message.populate('sender', 'name pic');

            // Update conversation
            conversation.lastMessage = message._id;
            conversation.lastActivity = new Date();
            await conversation.save();

            // console.log(`Message saved: ${message._id}`);

            // Send to all participants in the conversation
            this.io.to(`conversation_${conversationId}`).emit('new_message', {
                message,
                tempId
            });

            // console.log(`📨 Message broadcasted to conversation ${conversationId}`);

        } catch (error) {
            // console.error('Error saving message:', error);
            socket.emit('message_error', { error: 'Failed to save message', tempId });
        }
    }

    handleTypingStart(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        // console.log(`User ${userId} started typing in conversation ${conversationId}`);

        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Set());
        }

        this.typingUsers.get(conversationId).add(userId);

        socket.to(`conversation_${conversationId}`).emit('user_typing', {
            conversationId,
            userId,
            user: socket.userData
        });


        setTimeout(() => {   //clear typing indicator when not in use
            if (this.typingUsers.has(conversationId) && this.typingUsers.get(conversationId).has(userId)) {
                this.handleTypingStop(socket, data);
            }
        }, 3000);
    }

    handleTypingStop(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        // console.log(`User ${userId} stopped typing in conversation ${conversationId}`);

        if (this.typingUsers.has(conversationId)) {
            this.typingUsers.get(conversationId).delete(userId);
            
            if (this.typingUsers.get(conversationId).size === 0) {
                this.typingUsers.delete(conversationId);
            }
        }

        // Broadcast to others in conversation
        socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
            conversationId,
            userId
        });
    }

    async handleMarkMessagesRead(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        try {
            
            const result = await Message.updateMany(
                {
                    conversation: conversationId,
                    sender: { $ne: userId },
                    "readBy.user": { $ne: userId }
                },
                {
                    $push: {
                        readBy: {
                            user: userId,
                            readAt: new Date()
                        }
                    }
                }
            );

            // console.log(`User ${userId} marked messages as read in conversation ${conversationId}`);

            
            socket.to(`conversation_${conversationId}`).emit('messages_read', {
                conversationId,
                readBy: userId,
                readAt: new Date()
            });

        } catch (error) {
            // console.error('Error marking messages as read:', error);
        }
    }

    async handleDisconnection(socket) {
        const userId = socket.userId;
        
        if (this.users.has(userId)) {
            console.log(`User disconnected: ${socket.userData.name} (${userId})`);
            
            
            this.users.delete(userId);
            await this.updateUserOnlineStatus(userId, false);
            await this.broadcastOnlineStatus(userId, false);
            
            this.clearUserFromTyping(userId);   //clr typing indicotor
        }
    }

    async updateUserOnlineStatus(userId, isOnline, socketId = null) {
        try {
            await User.findByIdAndUpdate(userId, {
                isOnline,
                lastActive: new Date(),
                socketId: isOnline ? socketId : null
            });
            // console.log(`User ${userId} status updated: ${isOnline ? 'Online' : 'Offline'}`);
        } catch (error) {
            // console.error('Update online status error:', error);
        }
    }

    async broadcastOnlineStatus(userId, isOnline) {
        try {
            const user = await User.findById(userId)
                .populate('followers', '_id socketId')
                .populate('following', '_id socketId');

            const connections = [...user.followers, ...user.following];
            const uniqueConnections = [...new Set(connections.map(u => u._id.toString()))];

            uniqueConnections.forEach(connectionId => {  //notify all cnnected friends
                const connection = this.users.get(connectionId);
                if (connection) {
                    this.io.to(connection.socketId).emit('user_status_change', {
                        userId,
                        isOnline,
                        lastActive: new Date()
                    });
                }
            });

            console.log(`status change for user ${userId}: ${isOnline ? 'Online' : 'Offline'}`);

        } catch (error) {
            console.error('online status error:', error);
        }
    }

    clearUserFromTyping(userId) {
        for (const [conversationId, typingUsers] of this.typingUsers.entries()) {
            if (typingUsers.has(userId)) {
                typingUsers.delete(userId);
                
                
                this.io.to(`conversation_${conversationId}`).emit('user_stop_typing', {  //notfy other when stoppd typing indicator
                    conversationId,
                    userId
                });
                
                if (typingUsers.size === 0) {
                    this.typingUsers.delete(conversationId);
                }
            }
        }
    }

    getOnlineUsersList(excludeUserId) {
        const onlineUsers = [];
        for (const [userId, data] of this.users.entries()) {
            if (userId !== excludeUserId) {
                onlineUsers.push({
                    userId,
                    user: data.user,
                    lastSeen: data.lastSeen
                });
            }
        }
        return onlineUsers;
    }

    
    getIO() {  //methd to get socket for parts of the app
        return this.io;
    }
}

export default SocketServer;