import express from "express";
import fileUpload from "express-fileupload";
import cloudinary from "cloudinary";
import requireLogin from "../middleware/requireLogin.js";
import User from "../models/User.js";

const router = express.Router();

// Cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File upload middleware
router.use(fileUpload({ 
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true
}));

// Upload Profile Picture
console.log("prfile");

router.post("/upload-profile-pic", requireLogin, async (req, res) => {
  try {
    console.log("📩 Hit profile picture API");
    console.log("👉 req.body:", req.body);
    console.log("👉 req.files:", req.files);

    if (!req.files || !req.files.image) {
      console.log("❌ No file received");
      return res.status(400).json({ error: "No image file provided" });
    }

    const file = req.files.image;
    console.log("✅ File received:", {
      name: file.name,
      mimetype: file.mimetype,
      size: file.size,
      tempFilePath: file.tempFilePath
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.log("❌ Invalid file type:", file.mimetype);
      return res.status(400).json({ error: "Invalid file type. Only images are allowed." });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log("❌ File too large:", file.size);
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
    }

    console.log("🔥 Uploading profile picture to Cloudinary...");

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "socialapp/profiles",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" }
      ]
    });

    console.log("✅ Cloudinary upload result:", result.secure_url);

    // Update user's profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.Userdata._id,
      { pic: result.secure_url },
      { new: true }
    ).select("-password");

    console.log("✅ User updated:", updatedUser._id);

    res.json({
      success: true,
      url: result.secure_url,
      user: updatedUser,
      message: "Profile picture updated successfully"
    });

  } catch (error) {
    console.error("❌ Profile picture upload error:", error);
    res.status(500).json({
      error: "Profile picture upload failed",
      details: error.message
    });
  }
});
export default router;