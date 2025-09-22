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


messageSchema.virtual('isRead').get(function() { //for message read by user
    
    return this.readBy && Array.isArray(this.readBy) && this.readBy.length > 0;  //check for read message by existing user
});


messageSchema.virtual('isReadByCurrentUser').get(function() { // check for mssg readby curr user
    // This will be populated dynamically in the route
    return false;
});


messageSchema.pre('save', function(next) {   //save in as array
    if (this.isNew && !this.readBy) {
        this.readBy = [];
    }
    if (this.isModified('content')) {
        this.content = this.content.trim();
    }
    next();
});


messageSchema.index({ conversation: 1, createdAt: -1 });  //message index for speed
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;