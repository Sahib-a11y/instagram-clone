import bcrypt from 'bcrypt'
import { json, Router } from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import requireLogin from '../middleware/requireLogin.js'
import Post from '../models/Post.js'

const router = Router()

router.post("/createPost", requireLogin, async(req, res) => {
    try {
        const {title, body, pic} = req.body
        if (!title || !body || !pic) {
            return res.status(422).json({"error": "Please fill the fields"})
        } else {
            const post = new Post({
                title,
                body,
                photo: pic,
                postedBy: req.Userdata._id
            })
            const result = await post.save()
            
           
            await result.populate('postedBy', 'name pic email')
            
            return res.status(200).json({msg: "post created", result})
        }
    } catch (error) {
        console.log("Create post error:", error)
        return res.status(500).json({error: "Internal server error"})
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
        
        // Check if post exists
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({error: "Post not found"})
        }
        
        // Check if user already liked the post
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
        return res.status(500).json({error: "Internal server error", details: error.message})
    }
})

router.put('/unlike', requireLogin, async(req, res) => {
    try {
        const {postId} = req.body
        
        if (!postId) {
            return res.status(422).json({error: "Post ID is required"})
        }
        
        // Check if post exists
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({error: "Post not found"})
        }
        
        // Check if user has liked the post
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
        return res.status(500).json({error: "Internal server error", details: error.message})
    }
})

router.put("/comment", requireLogin, async(req, res) => {
    try {
        const Comment = {
            text: req.body.text,
            postedBy: req.Userdata._id,
            createdAt: new Date() // Add timestamp when comment is created
        }

        const result = await Post.findByIdAndUpdate(req.body.postId, {
            $push: {Comment: Comment}
        }, {
            new: true
        }).populate('postedBy', 'name pic email')
          .populate('Comment.postedBy', 'name pic email')
          
        return res.status(200).json({msg: "commented", result})
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