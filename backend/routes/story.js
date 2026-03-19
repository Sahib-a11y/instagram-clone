import express from "express";
import Story from "../models/Story.js";
import User from "../models/User.js";
import requireLogin from "../middleware/requireLogin.js";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

router.post("/upload", requireLogin, async (req, res) => {
  try {
    if (!req.files || !req.files.media) {
      return res.status(400).json({ error: "No media file provided" });
    }

    const file = req.files.media;
    const type = req.body.type || (file.mimetype.startsWith('video/') ? 'video' : 'image');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only images and videos are allowed." });
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return res.status(400).json({ error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` });
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "socialapp/stories",
      resource_type: type === 'video' ? 'video' : 'image',
      transformation: type === 'image' ? [
        { width: 720, height: 1280, crop: "fill" },
        { quality: "auto" }
      ] : undefined
    });

    // Create story with expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const isHighlight = req.body.isHighlight === 'true' || req.body.isHighlight === true;

    const story = await Story.create({
      user: req.Userdata._id,
      mediaUrl: result.secure_url,
      type,
      expiresAt,
      isHighlight,
    });

    res.status(201).json({
      story,
      url: result.secure_url,
      message: "Story uploaded successfully"
    });
  } catch (error) {
    console.error("Story upload error:", error);
    res.status(500).json({
      message: "Error uploading story",
      error: error.message || error,
    });
  }
});

router.get("/my", requireLogin, async (req, res) => {
  try {
    // Get active stories (not expired) or highlights
    const stories = await Story.find({
      user: req.Userdata._id,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { isHighlight: true }
      ]
    })
      .populate("user", "name email pic")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    // console.error("Get my stories error:", error);
    res.status(500).json({
      message: "Error fetching stories",
      error: error.message || error,
    });
  }
});

router.get("/feed", requireLogin, async (req, res) => {
  try {
    // Get stories from users that current user follows, plus their own stories
    const user = await User.findById(req.Userdata._id).populate('following', '_id');

    const followingIds = user.following.map(f => f._id);
    followingIds.push(req.Userdata._id); // Include own stories

    const stories = await Story.find({
      user: { $in: followingIds },
      expiresAt: { $gt: new Date() }
    })
      .populate("user", "name email pic")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("Get feed stories error:", error);
    res.status(500).json({
      message: "Error fetching feed stories",
      error: error.message || error,
    });
  }
});

// Cron job simulation - delete expired stories
router.delete("/cleanup", async (req, res) => {
  try {
    const result = await Story.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    res.json({
      message: `Deleted ${result.deletedCount} expired stories`
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({
      message: "Error during cleanup",
      error: error.message || error,
    });
  }
});

router.get("/highlights", requireLogin, async (req, res) => {
  try {
    // Get only highlighted stories (no expiration filter since they persist)
    const highlights = await Story.find({
      user: req.Userdata._id,
      isHighlight: true
    })
      .populate("user", "name email pic")
      .sort({ createdAt: -1 });

    res.json(highlights);
  } catch (error) {
    console.error("Get highlights error:", error);
    res.status(500).json({
      message: "Error fetching highlights",
      error: error.message || error,
    });
  }
});

// Mark story as viewed
router.post("/:id/view", requireLogin, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });

    // Check if user already viewed this story
    const alreadyViewed = story.viewers.some(viewer =>
      viewer.user.toString() === req.Userdata._id.toString()
    );

    if (!alreadyViewed) {
      story.viewers.push({
        user: req.Userdata._id,
        viewedAt: new Date()
      });
      await story.save();
    }

    res.json({ message: "Story viewed successfully" });
  } catch (error) {
    console.error("View story error:", error);
    res.status(500).json({
      message: "Error marking story as viewed",
      error: error.message || error,
    });
  }
});

router.delete("/:id", requireLogin, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });


    if (story.user.toString() !== req.Userdata._id.toString()) {
      return res.status(401).json({ message: "Not Authorized" });
    }

    await story.deleteOne();
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    // console.error("Delete story error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message || error,
    });
  }
});

export default router;
