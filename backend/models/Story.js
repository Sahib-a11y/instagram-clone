import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "video", "text"],
    required: true,
  },
  textContent: {
    type: String,
    default: "",
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  isHighlight: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for automatic expiration
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient queries
storySchema.index({ user: 1, expiresAt: -1 });

export default mongoose.model("Story", storySchema);
