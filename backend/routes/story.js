import express from "express";
import Story from "../models/Story.js";
import requireLogin from "../middleware/requireLogin.js";

const router = express.Router();


router.post("/upload", requireLogin, async (req, res) => {
  const { mediaUrl, type } = req.body;

  try {
    const story = await Story.create({
      user: req.Userdata._id,
      mediaUrl,
      type,
    });
    res.status(201).json(story);
  } catch (error) {
    console.error("Story upload error:", error); // <-- debug
    res.status(500).json({
      message: "Error uploading story",
      error: error.message || error,
    });
  }
});

router.get("/my", requireLogin, async (req, res) => {
  try {
    const stories = await Story.find({ user: req.user._id }) // <-- sirf apne stories
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("Get my stories error:", error); // <-- debug
    res.status(500).json({
      message: "Error fetching stories",
      error: error.message || error,
    });
  }
});

router.delete("/:id", requireLogin, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) return res.status(404).json({ message: "Story not found" });

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not Authorized" }); // <-- fix typo
    }

    await story.deleteOne();
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error); // <-- debug
    res.status(500).json({
      message: "Server Error",
      error: error.message || error,
    });
  }
});

export default router;