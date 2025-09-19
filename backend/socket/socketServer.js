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

        this.users = new Map(); // userId -> { socketId, user }
        this.typingUsers = new Map(); // conversationId -> Set of userIds
        
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        // Authentication middleware
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
                console.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.userData.name} (${socket.userId})`);
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const userId = socket.userId;
        const userData = socket.userData;

        // Store user connection
        this.users.set(userId, { 
            socketId: socket.id, 
            user: userData,
            lastSeen: new Date()
        });

        // Update user online status
        await this.updateUserOnlineStatus(userId, true, socket.id);

        // Join user to their personal room
        socket.join(`user_${userId}`);

        // Notify connections about online status
        await this.broadcastOnlineStatus(userId, true);

        // Socket event handlers
        this.setupSocketEventHandlers(socket);
    }

    setupSocketEventHandlers(socket) {
        const userId = socket.userId;

        // Handle joining conversation rooms
        socket.on('join_conversation', async (conversationId) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId
                });

                if (conversation) {
                    socket.join(`conversation_${conversationId}`);
                    console.log(`📨 User ${userId} joined conversation ${conversationId}`);
                }
            } catch (error) {
                console.error('Join conversation error:', error);
            }
        });

        // Handle leaving conversation rooms
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
            console.log(`📤 User ${userId} left conversation ${conversationId}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                await this.handleSendMessage(socket, data);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('message_error', { error: 'Failed to send message', tempId: data.tempId });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data) => {
            this.handleTypingStart(socket, data);
        });

        socket.on('typing_stop', (data) => {
            this.handleTypingStop(socket, data);
        });

        // Handle message read status
        socket.on('mark_messages_read', async (data) => {
            try {
                await this.handleMarkMessagesRead(socket, data);
            } catch (error) {
                console.error('Mark messages read error:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }

    async handleSendMessage(socket, data) {
        const { conversationId, content, tempId } = data;
        const userId = socket.userId;

        console.log(`📤 User ${userId} sending message to conversation ${conversationId}:`, content);

        // Verify conversation access
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId
        });

        if (!conversation) {
            console.error('Conversation not found or access denied');
            socket.emit('message_error', { error: 'Conversation not found', tempId });
            return;
        }

        // Check message permissions
        if (conversation.isMessageRequest && !conversation.requestAccepted && 
            conversation.requestFrom.toString() !== userId) {
            console.error('Cannot send message to unaccepted request');
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

            console.log(`✅ Message saved: ${message._id}`);

            // Send to all participants in the conversation
            this.io.to(`conversation_${conversationId}`).emit('new_message', {
                message,
                tempId
            });

            console.log(`📨 Message broadcasted to conversation ${conversationId}`);

        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('message_error', { error: 'Failed to save message', tempId });
        }
    }

    handleTypingStart(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        console.log(`⌨️ User ${userId} started typing in conversation ${conversationId}`);

        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Set());
        }

        this.typingUsers.get(conversationId).add(userId);

        // Broadcast to others in conversation (except sender)
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
            conversationId,
            userId,
            user: socket.userData
        });

        // Clear typing after 3 seconds of inactivity
        setTimeout(() => {
            if (this.typingUsers.has(conversationId) && this.typingUsers.get(conversationId).has(userId)) {
                this.handleTypingStop(socket, data);
            }
        }, 3000);
    }

    handleTypingStop(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        console.log(`💤 User ${userId} stopped typing in conversation ${conversationId}`);

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
            // Mark messages as read
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

            console.log(`📖 User ${userId} marked messages as read in conversation ${conversationId}`);

            // Notify other participants
            socket.to(`conversation_${conversationId}`).emit('messages_read', {
                conversationId,
                readBy: userId,
                readAt: new Date()
            });

        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    async handleDisconnection(socket) {
        const userId = socket.userId;
        
        if (this.users.has(userId)) {
            console.log(`🔌 User disconnected: ${socket.userData.name} (${userId})`);
            
            // Remove from users map
            this.users.delete(userId);
            
            // Update user offline status
            await this.updateUserOnlineStatus(userId, false);
            
            // Notify connections about offline status
            await this.broadcastOnlineStatus(userId, false);
            
            // Clear typing indicators
            this.clearUserFromTyping(userId);
        }
    }

    async updateUserOnlineStatus(userId, isOnline, socketId = null) {
        try {
            await User.findByIdAndUpdate(userId, {
                isOnline,
                lastActive: new Date(),
                socketId: isOnline ? socketId : null
            });
            console.log(`🟢 User ${userId} status updated: ${isOnline ? 'Online' : 'Offline'}`);
        } catch (error) {
            console.error('Update online status error:', error);
        }
    }

    async broadcastOnlineStatus(userId, isOnline) {
        try {
            const user = await User.findById(userId)
                .populate('followers', '_id socketId')
                .populate('following', '_id socketId');

            const connections = [...user.followers, ...user.following];
            const uniqueConnections = [...new Set(connections.map(u => u._id.toString()))];

            // Notify all connected friends about status change
            uniqueConnections.forEach(connectionId => {
                const connection = this.users.get(connectionId);
                if (connection) {
                    this.io.to(connection.socketId).emit('user_status_change', {
                        userId,
                        isOnline,
                        lastActive: new Date()
                    });
                }
            });

            console.log(`📢 Broadcasted status change for user ${userId}: ${isOnline ? 'Online' : 'Offline'}`);

        } catch (error) {
            console.error('Broadcast online status error:', error);
        }
    }

    clearUserFromTyping(userId) {
        for (const [conversationId, typingUsers] of this.typingUsers.entries()) {
            if (typingUsers.has(userId)) {
                typingUsers.delete(userId);
                
                // Notify others that user stopped typing
                this.io.to(`conversation_${conversationId}`).emit('user_stop_typing', {
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

    // Method to get socket instance for other parts of the app
    getIO() {
        return this.io;
    }
}

export default SocketServer;