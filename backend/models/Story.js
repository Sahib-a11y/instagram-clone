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
    enum: ["image", "video"],
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Story", storySchema);
