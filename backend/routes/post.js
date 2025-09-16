import bcrypt from 'bcrypt'
import { json, Router } from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import requireLogin from '../middleware/requireLogin.js'
import Post from '../models/Post.js'
import fileUpload from "express-fileupload"
import cloudinary from "cloudinary"

const router = Router()

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


router.use(fileUpload({ 
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, 
  abortOnLimit: true
}))


router.post("/createPost", requireLogin, async(req, res) => {
    try {
        console.log("CreatePost route hit");
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);
        console.log("User data:", req.Userdata);
        
        const { title, body } = req.body
        
        if (!title || !body) {
            console.log(" Missing title or body:", { title, body });
            return res.status(422).json({"error": "Please fill title and description fields"})
        }
        
        if (!req.files || !req.files.image) {
            console.log("No files or image:", req.files);
            return res.status(422).json({"error": "Please select an image"})
        }

        const file = req.files.image
        console.log(" File details:", {
            name: file.name,
            mimetype: file.mimetype,
            size: file.size,
            tempFilePath: file.tempFilePath
        });
        
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.mimetype)) {
            console.log(" Invalid file type:", file.mimetype);
            return res.status(400).json({ error: "Invalid file type. Only images are allowed." })
        }

        
        if (file.size > 10 * 1024 * 1024) {
            console.log(" File too large:", file.size);
            return res.status(400).json({ error: "File too large. Maximum size is 10MB." })
        }

        console.log(" Uploading image to Cloudinary...");
        console.log(" Cloudinary config check:", {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
            api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
            api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
        });
        
        
        const cloudinaryResult = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "socialapp/posts", 
            resource_type: "image",
            transformation: [
                { width: 1080, height: 1080, crop: "limit" }, 
                { quality: "auto" } 
            ]
        })

        console.log("Image uploaded to Cloudinary:", cloudinaryResult.secure_url)

        
        const post = new Post({
            title: title.trim(),
            body: body.trim(),
            photo: cloudinaryResult.secure_url,
            postedBy: req.Userdata._id
        })
        
        const result = await post.save()
        await result.populate('postedBy', 'name pic email')
        
        console.log("Post created successfully")
        
        return res.status(200).json({
            msg: "Post created successfully", 
            result,
            imageUrl: cloudinaryResult.secure_url
        })

    } catch (error) {
        console.log("Create post error:", error)
        console.log(" Error stack:", error.stack)
        
        // Handle specific Cloudinary errors
        if (error.message && error.message.includes('Must supply api_key')) {
            return res.status(500).json({error: "Image upload service not configured properly"})
        }
        
        return res.status(500).json({
            error: "Failed to create post", 
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        })
    }
})


router.post("/allpost", requireLogin, async(req, res) => {
    try {
        const posts = await Post.find()
            .populate('postedBy', 'name pic email')
            .populate('Comment.postedBy', 'name pic email')
            .sort({createdAt: -1})
            
        return res.status(200).json({posts})
    } catch (error) {
        console.log("Get all posts error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})


router.get("/mypost", requireLogin, async(req, res) => {
    try {
        const {_id} = req.Userdata
        const post = await Post.find({postedBy: _id})
            .populate('postedBy', 'name pic email')
            .populate('Comment.postedBy', 'name pic email')
            .sort({createdAt: -1})
            
        return res.status(200).json({post})
    } catch (error) {
        console.log("Get my posts error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})


router.get("/subpost", requireLogin, async(req, res) => {
    try {
        const result = await Post.find({postedBy: {$in: req.Userdata.following}})
            .populate('postedBy', 'name pic email')
            .populate('Comment.postedBy', 'name pic email')
            .sort({createdAt: -1})
            
        return res.status(200).json(result)
    } catch (error) {
        console.log("Get subscription posts error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})


router.put('/like', requireLogin, async(req, res) => {
    try {
        const {postId} = req.body
        
        if (!postId) {
            return res.status(422).json({error: "Post ID is required"})
        }
        
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({error: "Post not found"})
        }
        
        if (post.like.includes(req.Userdata._id)) {
            return res.status(422).json({error: "Post already liked"})
        }
        
        const result = await Post.findByIdAndUpdate(postId, {
            $push: {like: req.Userdata._id}
        }, {
            new: true
        }).populate('postedBy', 'name pic email')
          .populate('Comment.postedBy', 'name pic email')
          
        return res.status(200).json({msg: "Post liked successfully", result})
    } catch (error) {
        console.log("Like error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})


router.put('/unlike', requireLogin, async(req, res) => {
    try {
        const {postId} = req.body
        
        if (!postId) {
            return res.status(422).json({error: "Post ID is required"})
        }
        
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({error: "Post not found"})
        }
        
        if (!post.like.includes(req.Userdata._id)) {
            return res.status(422).json({error: "Post not liked yet"})
        }
        
        const result = await Post.findByIdAndUpdate(postId, {
            $pull: {like: req.Userdata._id}
        }, {
            new: true
        }).populate('postedBy', 'name pic email')
          .populate('Comment.postedBy', 'name pic email')
          
        return res.status(200).json({msg: "Post unliked successfully", result})
    } catch (error) {
        console.log("Unlike error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})


router.put("/comment", requireLogin, async(req, res) => {
    try {
        const Comment = {
            text: req.body.text,
            postedBy: req.Userdata._id,
            createdAt: new Date()
        }

        const result = await Post.findByIdAndUpdate(req.body.postId, {
            $push: {Comment: Comment}
        }, {
            new: true
        }).populate('postedBy', 'name pic email')
          .populate('Comment.postedBy', 'name pic email')
          
        return res.status(200).json({msg: "Comment added successfully", result})
    } catch (error) {
        console.log("Comment error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})


router.delete("/deletepost/:postId", requireLogin, async(req, res) => {
    try {
        const {postId} = req.params
        const result = await Post.findById(postId).populate('postedBy', '_id')
        
        if (!result) {
            return res.status(422).json({msg: "Post not found"})
        }
        
        if (result.postedBy._id.toString() === req.Userdata._id.toString()) {
           
            if (result.photo && result.photo.includes('cloudinary.com')) {
                try {
                    const publicId = result.photo.split('/').pop().split('.')[0]
                    await cloudinary.v2.uploader.destroy(`socialapp/posts/${publicId}`)
                    console.log("Image deleted from Cloudinary")
                } catch (cloudError) {
                    console.log("Could not delete image from Cloudinary:", cloudError.message)
                }
            }
            
            await result.deleteOne()
            return res.status(200).json({msg: "Post deleted successfully"})
        } else {
            return res.status(422).json({msg: "You are not authorized to delete this post"})
        }
    } catch (error) {
        console.log("Delete post error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})

export default router