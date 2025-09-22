import { Router } from "express";
import requireLogin from "../middleware/requireLogin.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const router = Router();


router.get("/conversations", requireLogin, async (req, res) => { //all conversation for current user
    try {
        const conversations = await Conversation.find({
            participants: req.Userdata._id,
            $or: [
                { isMessageRequest: false },
                { requestFrom: req.Userdata._id },
                { requestAccepted: true }
            ]
        })
        .populate('participants', 'name pic isOnline lastActive')
        .populate({
            path: 'lastMessage',
            select: 'content sender createdAt readBy',
            options: { retainNullValues: true }
        })
        .populate({
            path: 'requestFrom',
            select: 'name pic',
            options: { retainNullValues: true }
        })
        .sort({ lastActivity: -1 });

        
        const processedConversations = conversations.map(conversation => {   // for conversation process
            const conv = conversation.toObject();
            
            
            if (conv.lastMessage) {  //last seen user check exist or not.
                if (!conv.lastMessage.readBy) {
                    conv.lastMessage.readBy = [];
                }
                
                conv.lastMessage.isRead = conv.lastMessage.readBy.length > 0;
            }
            
            return conv;
        });

        res.json({ conversations: processedConversations });
    } catch (error) {
        // console.error("Get conversations error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/message-requests", requireLogin, async (req, res) => {  //message request when others private account 
    try {
        const requests = await Conversation.find({
            participants: req.Userdata._id,
            isMessageRequest: true,
            requestAccepted: false,
            requestFrom: { $ne: req.Userdata._id }
        })
        .populate('participants', 'name pic')
        .populate({
            path: 'lastMessage',
            select: 'content sender createdAt readBy',
            options: { retainNullValues: true }
        })
        .populate({
            path: 'requestFrom',
            select: 'name pic',
            options: { retainNullValues: true }
        })
        .sort({ lastActivity: -1 });

        const processedRequests = requests.map(request => {
            const req = request.toObject();
            
            if (req.lastMessage) {
                if (!req.lastMessage.readBy) {
                    req.lastMessage.readBy = [];
                }
                req.lastMessage.isRead = req.lastMessage.readBy.length > 0;
            }
            
            return req;
        });

        res.json({ requests: processedRequests });
    } catch (error) {
        // console.error("Get message requests error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/conversation/:conversationId/messages", requireLogin, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.Userdata._id
        });

        if (!conversation) {
            return res.status(403).json({ error: "Access denied" });
        }

        
        const messages = await Message.find({ 
            conversation: conversationId,
            deletedFor: { $ne: req.Userdata._id }
        })
        .populate('sender', 'name pic')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        
        const processedMessages = messages.map(message => {
            const msg = message.toObject();
            
            if (!msg.readBy) {
                msg.readBy = [];
            }
            
            msg.isRead = msg.readBy.length > 0;
            msg.isReadByCurrentUser = msg.readBy.some(read => 
                read.user && read.user.toString() === req.Userdata._id.toString()
            );
            
            return msg;
        });

        res.json({ messages: processedMessages.reverse() });
    } catch (error) {
        // console.error("Get messages error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.post("/message", requireLogin, async (req, res) => {  // Send message
    try {
        const { conversationId, content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ error: "Message content required" });
        }

        const conversation = await Conversation.findOne({  //verify converstaion
            _id: conversationId,
            participants: req.Userdata._id
        });

        if (!conversation) {
            return res.status(403).json({ error: "Access denied" });
        }

        
        if (conversation.isMessageRequest && !conversation.requestAccepted &&   //check for mesaage request has been accepted or not
            conversation.requestFrom.toString() !== req.Userdata._id.toString()) {
            return res.status(403).json({ error: "Cannot send message to unaccepted request" });
        }

        
        const message = new Message({
            conversation: conversationId,
            sender: req.Userdata._id,
            content: content.trim(),
            isRequestMessage: conversation.isMessageRequest && !conversation.requestAccepted,
            readBy: [] 
        });

        await message.save();
        await message.populate('sender', 'name pic');


        conversation.lastMessage = message._id;
        conversation.lastActivity = new Date();
        await conversation.save();

        
        const responseMessage = message.toObject();
        responseMessage.readBy = responseMessage.readBy || [];

        res.json({ message: responseMessage });
    } catch (error) {
        // console.error("Send message error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put("/conversation/:conversationId/read", requireLogin, async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.Userdata._id
        });

        if (!conversation) {
            return res.status(403).json({ error: "Access denied" });
        }


        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: req.Userdata._id },
                $or: [
                    { "readBy.user": { $ne: req.Userdata._id } },
                    { "readBy": { $exists: false } },
                    { "readBy": null }
                ]
            },
            {
                $push: {
                    readBy: {
                        user: req.Userdata._id,
                        readAt: new Date()
                    }
                }
            },
            {
                
                setDefaultsOnInsert: true
            }
        );

        res.json({ message: "Messages marked as read" });
    } catch (error) {
        // console.error("Mark read error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.put("/accept-request/:conversationId", requireLogin, async (req, res) => {   //when mssg req accept
    try {
        const conversation = await Conversation.findOneAndUpdate(
            { 
                _id: req.params.conversationId,
                participants: req.Userdata._id,
                isMessageRequest: true
            },
            { 
                requestAccepted: true,
                isMessageRequest: false
            },
            { new: true }
        );

        if (!conversation) {
            return res.status(404).json({ error: "Request not found" });
        }

        res.json({ message: "Message request accepted", conversation });
    } catch (error) {
        // console.error("Accept request error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/conversation", requireLogin, async (req, res) => {  // route for get or create conversation
    try {
        const { participantId } = req.body;
        const currentUserId = req.Userdata._id;

        if (currentUserId.toString() === participantId) {
            return res.status(400).json({ error: "Cannot create conversation with yourself" });
        }

        const participant = await User.findById(participantId);
        if (!participant) {
            return res.status(404).json({ error: "User not found" });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, participantId] }
        }).populate('participants', 'name pic isOnline lastActive');

        if (conversation) {
            return res.json({ conversation });
        }

        const currentUser = req.Userdata;
        const canMessage = !participant.isPrivate || 
                          participant.followers.includes(currentUserId) || 
                          currentUser.following.includes(participantId);

        conversation = new Conversation({
            participants: [currentUserId, participantId],
            isMessageRequest: !canMessage,
            requestFrom: currentUserId,
            requestAccepted: canMessage
        });

        await conversation.save();
        await conversation.populate('participants', 'name pic isOnline lastActive');

        res.json({ 
            conversation, 
            isRequest: !canMessage,
            message: canMessage ? "Conversation created" : "Message request created"
        });

    } catch (error) {
        // console.error("Create conversation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.delete("/message/:messageId", requireLogin, async (req, res) => {   //route for delete mssg 
    try {
        const { messageId } = req.params;
        const { deleteFor } = req.body; // 'me' or 'everyone'

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (deleteFor === 'everyone' && message.sender.toString() !== req.Userdata._id.toString()) {
            return res.status(403).json({ error: "Can only delete your own messages for everyone" });
        }

        if (deleteFor === 'everyone') {
            message.isDeleted = true;
        } else {
            message.deletedFor.push(req.Userdata._id);
        }

        await message.save();
        res.json({ message: "Message deleted" });
    } catch (error) {
        // console.error("Delete message error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/online-users", requireLogin, async (req, res) => {   //route for online user
    try {
        const currentUser = await User.findById(req.Userdata._id)
            .populate('following', 'name pic isOnline lastActive')
            .populate('followers', 'name pic isOnline lastActive');

        const connections = [...currentUser.following, ...currentUser.followers];
        const uniqueConnections = connections.filter((user, index, self) => 
            self.findIndex(u => u._id.toString() === user._id.toString()) === index
        );

        const onlineUsers = uniqueConnections.filter(user => user.isOnline);
        
        res.json({ onlineUsers, totalConnections: uniqueConnections.length });
    } catch (error) {
        // console.error("Get online users error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;