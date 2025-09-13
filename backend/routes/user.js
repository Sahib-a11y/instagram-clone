import {Router} from "express";
import requireLogin from "../middleware/requireLogin.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

const router = Router()

router.get("/user/:id", requireLogin, async(req, res) => {
    try {
        const result = await User.findOne({_id: req.params.id})
            .select("-password")
            .populate('followers', 'name pic email')
            .populate('following', 'name pic email')
            
        if (!result) {
            return res.status(422).json({msg: "User Not Found"})
        }
        
        const posts = await Post.find({postedBy: req.params.id})
            .populate('postedBy', 'name pic email')
            .populate('Comment.postedBy', 'name pic email')
            .sort({createdAt: -1})
            
        return res.status(200).json({
            msg: "User profile fetched successfully",
            result,
            posts
        })
    } catch (error) {
        console.log("Get user profile error:", error)
        return res.status(500).json({error: "Internal server error"})
    }    
})

router.put('/follow', requireLogin, async(req, res) => {
    try {
        // Add current user to target user's followers
        const followedUser = await User.findByIdAndUpdate(req.body.followId, {
            $push: {followers: req.Userdata._id}
        }, {
            new: true
        }).select("-password")
        
        // Add target user to current user's following
        const currentUser = await User.findByIdAndUpdate(req.Userdata._id, {
            $push: {following: req.body.followId}
        }, {
            new: true
        }).select("-password")
        
        return res.status(200).json({
            msg: "Successfully followed user",
            followedUser,
            currentUser
        })
    } catch (error) {
        console.log("Follow error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})

router.put('/unfollow', requireLogin, async(req, res) => {
    try {
        // Remove current user from target user's followers
        const unfollowedUser = await User.findByIdAndUpdate(req.body.UnfollowId, {
            $pull: {followers: req.Userdata._id}
        }, {
            new: true
        }).select("-password")
        
        // Remove target user from current user's following
        const currentUser = await User.findByIdAndUpdate(req.Userdata._id, {
            $pull: {following: req.body.UnfollowId}
        }, {
            new: true
        }).select("-password")
        
        return res.status(200).json({
            msg: "Successfully unfollowed user",
            unfollowedUser,
            currentUser
        })
    } catch (error) {
        console.log("Unfollow error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})

// Get followers list
router.get('/followers/:userId', requireLogin, async(req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('followers', 'name pic email createdAt')
            .select('followers')
            
        if (!user) {
            return res.status(404).json({error: "User not found"})
        }
        
        return res.status(200).json({
            followers: user.followers
        })
    } catch (error) {
        console.log("Get followers error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})

// Get following list
router.get('/following/:userId', requireLogin, async(req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('following', 'name pic email createdAt')
            .select('following')
            
        if (!user) {
            return res.status(404).json({error: "User not found"})
        }
        
        return res.status(200).json({
            following: user.following
        })
    } catch (error) {
        console.log("Get following error:", error)
        return res.status(500).json({error: "Internal server error"})
    }
})

export default router