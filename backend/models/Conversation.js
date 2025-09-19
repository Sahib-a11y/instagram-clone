import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isMessageRequest: {
    type: Boolean,
    default: false
  },
  requestFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  requestAccepted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for better performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastActivity: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;