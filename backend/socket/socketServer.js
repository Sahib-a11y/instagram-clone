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

        this.users = new Map(); // userId -> { socketId, user, lastSeen }
        this.typingUsers = new Map(); // conversationId -> Set of userIds
        
        this.setupSocketHandlers();
    }

    setupSocketHandlers() {
        
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
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }

    async handleConnection(socket) {
        const userId = socket.userId;
        const userData = socket.userData;

                this.users.set(userId, {
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

        
        socket.on('join_conversation', async (data) => {
            try {
                const { conversationId } = data;
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId
                });

                if (conversation) {
                    socket.join(`conversation_${conversationId}`);
                    
                    
                    const room = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
                    
                    
                } else {
                    console.log(`Conversation not found or access denied: ${conversationId}`);
                }
            } catch (error) {
                console.error('Join conversation error:', error);
            }
        });

        
        socket.on('leave_conversation', (data) => {
            const { conversationId } = data;
            socket.leave(`conversation_${conversationId}`);
            
        });

        
        socket.on('send_message', async (data) => {
            try {
                const { conversationId, content, tempId } = data;

                

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId
                });

                if (!conversation) {
                    socket.emit('message_error', { error: 'Conversation not found', tempId });
                    return;
                }

                
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

                
                socket.to(`conversation_${conversationId}`).emit('new_message', {
                    message: messageData,
                    tempId
                });

                

                
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


            } catch (error) {
                socket.emit('message_error', { error: 'Failed to send message', tempId: data.tempId });
            }
        });

                socket.on('typing_start', (data) => {
            this.handleTypingStart(socket, data);
        });

        
        socket.on('typing_stop', (data) => {
            this.handleTypingStop(socket, data);
        });

        socket.on('mark_messages_read', async (data) => {
            try {
                const { conversationId } = data;

                console.log(`User ${userId} marking messages as read in conversation ${conversationId}`);

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

                
                const conversation = await Conversation.findById(conversationId).populate('participants');
                
                if (conversation) {
                
                    conversation.participants.forEach(participant => {
                        if (participant._id.toString() !== userId) {
                            this.io.to(`user_${participant._id}`).emit('messages_read', {
                                conversationId: conversationId,
                                readBy: userId,
                                readAt: new Date()
                            });
                            
                        }
                    });
                }

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }

    handleTypingStart(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        

        
        const room = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
        

        
        if (!this.typingUsers.has(conversationId)) {
            this.typingUsers.set(conversationId, new Set());
        }
        this.typingUsers.get(conversationId).add(userId);

        
        const userData = {
            _id: socket.userData._id,
            name: socket.userData.name,
            pic: socket.userData.pic
        };

        socket.to(`conversation_${conversationId}`).emit('user_typing', {
            conversationId,
            userId,
            user: userData
        });

        
        setTimeout(() => {
            if (this.typingUsers.has(conversationId) && this.typingUsers.get(conversationId).has(userId)) {
                console.log(`Auto-stopping typing for user ${userId} in conversation ${conversationId}`);
                this.handleTypingStop(socket, data);
            }
        }, 3000);
    }

    handleTypingStop(socket, data) {
        const { conversationId } = data;
        const userId = socket.userId;

        
        const room = this.io.sockets.adapter.rooms.get(`conversation_${conversationId}`);

        if (this.typingUsers.has(conversationId)) {
            this.typingUsers.get(conversationId).delete(userId);
            
            if (this.typingUsers.get(conversationId).size === 0) {
                this.typingUsers.delete(conversationId);
            }
        }

       
        const userData = {
            _id: socket.userData._id,
            name: socket.userData.name,
            pic: socket.userData.pic
        };

        socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
            conversationId,
            userId,
            user: userData
        });

    }

    async handleDisconnection(socket) {
        const userId = socket.userId;
        const userName = socket.userData?.name || 'Unknown';
        
        if (this.users.has(userId)) {
        
            this.users.delete(userId);
            
            await this.updateUserOnlineStatus(userId, false);
        
            await this.broadcastOnlineStatus(userId, false);
        
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

        } catch (error) {
            console.error(error);
        }
    }

    clearUserFromTyping(userId) {
        
        
        for (const [conversationId, typingUsers] of this.typingUsers.entries()) {
            if (typingUsers.has(userId)) {
                typingUsers.delete(userId);
            
                this.io.to(`conversation_${conversationId}`).emit('user_stop_typing', {
                    conversationId,
                    userId,
                    user: { _id: userId } // Minimal user data
                });
                
                
                
                if (typingUsers.size === 0) {
                    this.typingUsers.delete(conversationId);
                }
            }
        }
    }

    
    getOnlineUsersList(excludeUserId = null) {
        const onlineUsers = [];
        for (const [userId, data] of this.users.entries()) {
            if (userId !== excludeUserId) {
                onlineUsers.push({
                    userId,
                    user: data.user,
                    lastSeen: data.lastSeen,
                    socketId: data.socketId
                });
            }
        }
        return onlineUsers;
    }

    getUserSocket(userId) {
        return this.users.get(userId);
    }

    isUserOnline(userId) {
        return this.users.has(userId);
    }
    getIO() {
        return this.io;
    }


    getServerStats() {
        return {
            totalConnections: this.users.size,
            activeConversations: this.typingUsers.size,
            typingUsers: Array.from(this.typingUsers.entries()).map(([conversationId, users]) => ({
                conversationId,
                typingUsers: Array.from(users)
            }))
        };
    }
}

export default SocketServer;