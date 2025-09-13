import express from "express";
import fileUpload from "express-fileupload";
import cloudinary from "cloudinary";

import Image from "../models/Image.js"; 

const router = express.Router();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


router.use(fileUpload({ useTempFiles: true }));

router.post("/", async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.files.image;
    const result = await cloudinary.v2.uploader.upload(file.tempFilePath);

    const newImage = new Image({
      url: result.secure_url,
      public_id: result.public_id,
    });

    await newImage.save();
    res.json(newImage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/", async (req, res) => {
  const images = await Image.find();
  res.json(images);
});


router.delete("/:id", async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) return res.status(404).json({ error: "Image not found" });

    await cloudinary.v2.uploader.destroy(image.public_id);
    await image.deleteOne();

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
