import {Router} from "express";
import requireLogin from "../middleware/requireLogin.js";
import User from "../models/User.js";
import Post from "../models/Post.js";



const router =Router()

router.get("/user/:id",requireLogin,async(req,res) => {
    const result = await  User.findOne({_id:req.params.id})
    if(!result){
        return res.status(422).json({msg:"User Not Found"})
    }else{
        result.password = undefined
        const posts = await Post.find({postedBy:req.params.id})
        return res.status(200).json({msg:"All Post",result,posts})
    }
    
})



router.put('/follow',requireLogin,async(req,res)=> {
    try {
    await User.findByIdAndUpdate(req.body.followId,{
        $push:{followers:req.Userdata._id}
    },{
        new:true
    })
    await User.findByIdAndUpdate(req.Userdata._id,{
        $push:{following:req.body.followId}
    },{
        new:true
    })
    return res.status(200).json({msg:"New follower Added"})
    } catch (error) {
        console.log("error",error);    
    }
})

router.put('/unfollow', requireLogin,async(req,res) => {
    try{
        await User.findByIdAndUpdate(req.body.UnfollowId,{
            $pull:{followers:req.Userdata._id}
        },{
            new:true
        })
        await User.findByIdAndUpdate(req.Userdata._id,{
            $pull:{following:req.body.UnfollowId}
        },{
            new:true
        })
        return res.status(200).json({msg:"You Unfollow User"})
    }catch (error){
        console.log("error",error);
    }
})


export default router