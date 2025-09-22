import express from "express";
import cloudinary from "cloudinary";
import requireLogin from "../middleware/requireLogin.js";
import User from "../models/User.js";

const router = express.Router();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post("/upload-profile-pic", requireLogin, async (req, res) => {
  try {
    // console.log("Hit profile picture API");
    // console.log("req.body:", req.body);
    // console.log("req.files:", req.files);

    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const file = req.files.image;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only images are allowed." });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
    }

    // Upload profile picture to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "socialapp/profiles",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" }
      ]
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.Userdata._id,
      { pic: result.secure_url },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      url: result.secure_url,
      user: updatedUser,
      message: "Profile picture updated successfully"
    });
  } catch (error) {
    // console.error("Profile picture upload error:", error);
    res.status(500).json({ error: "Profile picture upload failed", details: error.message });
  }
});

export default router;
