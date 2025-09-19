import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    isRequestMessage: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'video'],
        default: 'text'
    }
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Ensure readBy is always an array
            if (!ret.readBy) {
                ret.readBy = [];
            }
            return ret;
        }
    },
    toObject: { 
        virtuals: true,
        transform: function(doc, ret) {
            if (!ret.readBy) {
                ret.readBy = [];
            }
            return ret;
        }
    }
});

// Virtual for checking if message is read by a specific user
messageSchema.virtual('isRead').get(function() {
    // Safely check if readBy exists and has items
    return this.readBy && Array.isArray(this.readBy) && this.readBy.length > 0;
});

// Virtual to check if message is read by current user
messageSchema.virtual('isReadByCurrentUser').get(function() {
    // This will be populated dynamically in the route
    return false;
});

// Ensure readBy is always initialized as an array
messageSchema.pre('save', function(next) {
    if (this.isNew && !this.readBy) {
        this.readBy = [];
    }
    if (this.isModified('content')) {
        this.content = this.content.trim();
    }
    next();
});

// Indexes for better performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;