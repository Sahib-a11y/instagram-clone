import express from "express";
import Notification from "../models/Notification.js";
import requireLogin from "../middleware/requireLogin.js";

const router = express.Router();

// Get all notifications for current user
router.get("/", requireLogin, async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.Userdata._id })
      .populate("senderId", "name pic")
      .populate("postId", "title photo")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/unread-count", requireLogin, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      receiverId: req.Userdata._id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Mark all notifications as read  ← must be BEFORE /:id/read to avoid route shadowing
router.put("/mark-all-read", requireLogin, async (req, res) => {
  try {
    await Notification.updateMany(
      { receiverId: req.Userdata._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// Mark notification as read
router.put("/:id/read", requireLogin, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, receiverId: req.Userdata._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Delete notification
router.delete("/:id", requireLogin, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      receiverId: req.Userdata._id
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
