import cloudinary from "cloudinary";
import 'dotenv/config';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Testing Cloudinary connection...");
console.log("Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
});

//text uploading....
cloudinary.v2.uploader.upload("https://via.placeholder.com/150", function(error, result) {
  if (error) {
    console.error("Cloudinary test failed:", error);
  } else {
    console.log("Cloudinary test successful:", result.secure_url);
  }
  process.exit();
});