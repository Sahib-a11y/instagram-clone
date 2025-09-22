import {Router} from "express";
import requireLogin from "../middleware/requireLogin.js";
import User from "../models/User.js";
import Post from "../models/Post.js";
import fileUpload from "express-fileupload";
import cloudinary from "cloudinary";

const router = Router()

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


router.get("/search", requireLogin, async(req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ error: "Search query must be at least 2 characters" });
        }

        const searchRegex = new RegExp(query.trim(), 'i');
        const users = await User.find({
            $or: [
                { name: { $regex: searchRegex } },
                { email: { $regex: searchRegex } }
            ],
            _id: { $ne: req.Userdata._id } // Exclude current user
        })
        .select("name email pic isPrivate followers following")
        .limit(20);

        res.json({ users });
    } catch (error) {
        // console.log("Search users error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/suggestions", requireLogin, async(req, res) => {
    try {
        const currentUser = req.Userdata;
        
        // Find users that current user is not following and not themselves
        const suggestions = await User.find({
            _id: { 
                $ne: currentUser._id,
                $nin: currentUser.following 
            }
        })
        .select("name email pic isPrivate followers")
        .limit(10)
        .sort({ createdAt: -1 }); // Show newer users first

        res.json({ suggestions });
    } catch (error) {
        // console.log("Get suggestions error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/upload-profile-pic", 
    fileUpload({ 
        useTempFiles: true,
        tempFileDir: '/tmp/',
        limits: { fileSize: 10 * 1024 * 1024 },
        abortOnLimit: true,
        debug: true // debug for troubleshoot
    }), 
    requireLogin, 
    async(req, res) => {
    try {
        // console.log("Profile pic upload route hit");
        // console.log("Request files:", req.files);
        // console.log("Request body:", req.body);

        if (!req.files || !req.files.image) {
            // console.log("No files found");
            return res.status(400).json({ error: "No image file provided" });
        }

        const file = req.files.image;
        // console.log("File details:", {
        //     name: file.name,
        //     mimetype: file.mimetype,
        //     size: file.size,
        //     tempFilePath: file.tempFilePath
        // });

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ error: "Invalid file type. Only images are allowed." });
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
        }

        // console.log("Uploading profile picture to Cloudinary...");
        // console.log("Cloudinary config check:", {
        //     cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
        //     api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
        //     api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
        // });

        // Upload to Cloudinary
        const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "socialapp/profiles",
            resource_type: "image",
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto" }
            ]
        });

        // console.log("Cloudinary upload successful:", result.secure_url);

        // Update user's profile picture
        const updatedUser = await User.findByIdAndUpdate(
            req.Userdata._id,
            { pic: result.secure_url },
            { new: true }
        ).select("-password");

        // console.log("User profile updated");

        res.json({
            success: true,
            url: result.secure_url,
            user: updatedUser,
            message: "Profile picture updated successfully"
        });

    } catch (error) {
        // console.error("Profile picture upload error:", error);
        res.status(500).json({ 
            error: "Profile picture upload failed", 
            details: error.message 
        });
    }
});


router.put("/privacy", requireLogin, async(req, res) => {
    try {
        const { isPrivate } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.Userdata._id,
            { isPrivate: Boolean(isPrivate) },
            { new: true }
        ).select("-password");

        res.json({
            message: `Account is now ${isPrivate ? 'private' : 'public'}`,
            user: updatedUser
        });
    } catch (error) {
        // console.log("Update privacy error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});


router.get("/user/:id", requireLogin, async(req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.Userdata._id;
        
        const result = await User.findOne({_id: targetUserId})
            .select("-password")
            .populate('followers', 'name pic email')
            .populate('following', 'name pic email');
            
        if (!result) {
            return res.status(422).json({msg: "User Not Found"});
        }

        // Check if current user can view this profile
        const isOwnProfile = targetUserId === currentUserId.toString();
        const isFollowing = result.followers.some(follower => 
            follower._id.toString() === currentUserId.toString()
        );
        
        // If account is private and user is not following (and it's not their own profile)
        if (result.isPrivate && !isFollowing && !isOwnProfile) {
            return res.status(200).json({
                msg: "Private account",
                result: {
                    _id: result._id,
                    name: result.name,
                    pic: result.pic,
                    isPrivate: result.isPrivate,
                    followers: [],
                    following: []
                },
                posts: [],
                isPrivate: true,
                canViewPosts: false
            });
        }

        // Get posts if user can view them
        let posts = [];
        if (!result.isPrivate || isFollowing || isOwnProfile) {
            posts = await Post.find({postedBy: targetUserId})
                .populate('postedBy', 'name pic email')
                .populate('Comment.postedBy', 'name pic email')
                .sort({createdAt: -1});
        }
            
        return res.status(200).json({
            msg: "User profile fetched successfully",
            result,
            posts,
            isPrivate: result.isPrivate,
            canViewPosts: !result.isPrivate || isFollowing || isOwnProfile,
            isFollowing
        });
    } catch (error) {
        // console.log("Get user profile error:", error);
        return res.status(500).json({error: "Internal server error"});
    }    
});


router.put('/follow', requireLogin, async(req, res) => {
    try {
        const { followId } = req.body;
        const currentUserId = req.Userdata._id;

        if (currentUserId.toString() === followId) {
            return res.status(422).json({ error: "You cannot follow yourself" });
        }

        const targetUser = await User.findById(followId);
        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if already following
        if (targetUser.followers.includes(currentUserId)) {
            return res.status(422).json({ error: "Already following this user" });
        }

        // For private accounts, this would send a follow request
        // For now, we'll implement direct following
        // TODO: Implement follow requests for private accounts

        await User.findByIdAndUpdate(followId, {
            $push: { followers: currentUserId }
        });
        
        await User.findByIdAndUpdate(currentUserId, {
            $push: { following: followId }
        });
        
        return res.status(200).json({
            msg: targetUser.isPrivate ? "Follow request sent" : "Successfully followed user"
        });
    } catch (error) {
        // console.log("Follow error:", error);
        return res.status(500).json({error: "Internal server error"});
    }
});


router.put('/unfollow', requireLogin, async(req, res) => {
    try {
        const { UnfollowId } = req.body;
        const currentUserId = req.Userdata._id;

        await User.findByIdAndUpdate(UnfollowId, {
            $pull: { followers: currentUserId }
        });
        
        await User.findByIdAndUpdate(currentUserId, {
            $pull: { following: UnfollowId }
        });
        
        return res.status(200).json({
            msg: "Successfully unfollowed user"
        });
    } catch (error) {
        // console.log("Unfollow error:", error);
        return res.status(500).json({error: "Internal server error"});
    }
});


router.get('/followers/:userId', requireLogin, async(req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.Userdata._id;
        
        const user = await User.findById(userId)
            .populate('followers', 'name pic email isPrivate')
            .select('followers isPrivate');
            
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        // Check if current user can view followers list
        const canView = userId === currentUserId.toString() || 
                       !user.isPrivate || 
                       user.followers.some(f => f._id.toString() === currentUserId.toString());

        if (!canView) {
            return res.status(403).json({error: "Cannot view followers of private account"});
        }
        
        return res.status(200).json({
            followers: user.followers
        });
    } catch (error) {
        // console.log("Get followers error:", error);
        return res.status(500).json({error: "Internal server error"});
    }
});


router.get('/following/:userId', requireLogin, async(req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.Userdata._id;
        
        const user = await User.findById(userId)
            .populate('following', 'name pic email isPrivate')
            .select('following isPrivate');
            
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        // Check if current user can view following list
        const canView = userId === currentUserId.toString() || 
                       !user.isPrivate || 
                       user.followers && user.followers.includes(currentUserId);

        if (!canView) {
            return res.status(403).json({error: "Cannot view following of private account"});
        }
        
        return res.status(200).json({
            following: user.following
        });
    } catch (error) {
        // console.log("Get following error:", error);
        return res.status(500).json({error: "Internal server error"});
    }
});

export default router