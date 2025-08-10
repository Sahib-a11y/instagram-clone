import bcrypt from 'bcrypt'
import { json, Router } from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import requireLogin from '../middleware/requireLogin.js'
import Post from '../models/Post.js'
const router = Router()

router.post("/createPost",requireLogin,async(req,res)=> {
    try {
        const {title,body,pic} = req.body
        if (!title || !body || !pic){
            return res.status(422).json({"error":"Please fill the fields"})
        }else{
            const post  = new Post({
                title,
                body,
                photo:pic,
                postedBy:req.Userdata
            })
            const result  =  await post.save()
            return res.status(200).json({msg:"post created",result})
        }
    } catch (error) {
    }
})


router.post("/allpost",requireLogin,async(req,res)=>{
    try{
        const posts = await Post.find()
        return res.status(200).json({posts})
    }catch(error){
        console.log("error",error)
    }
})


router.get("/mypost",requireLogin,async(req,res)=>{
    try {
        const {_id} = req.Userdata
        const post = await Post.find({postedBy:_id})
        return res.status(200).json({post})
    }catch(error){
        console.log("Error",error)
    }
})


router.get("/subpost",requireLogin,async(req,res)=>{
   const result = await Post.find({postedBy:{$in:req.Userdata.following}})
   return res.status(200).json(result) 
})

router.put('/like', requireLogin,async(req,res)=>{
    try {
        const {postId} = req.body
        const result = await Post.findByIdAndUpdate(req.body.postId,{
            $push:{like:req.Userdata._id}
        },{
            new:true
        })
        return res.status(200).json({msg:"post updated succesfully",result})
    } catch (error) {
        console.log("Error",error)
    }
})

router.put('/unlike', requireLogin,async(req,res) => {
    try{
        const {postId} = req.body
        const result = await Post.findByIdAndUpdate(req.body.postId,{
            $pull:{like:req.userdata._id}
            
        },{
            new:true
        })
        return res.status(200).json({msg:"Post unliked",result})
    }catch(error){
        console.log("Error",error)
    }
})

router.put("/comment",requireLogin,async(req,res)=>{
    const Comment ={
        text:req.body.text,
        postedBy:req.Userdata._id
    }

    const result =  await Post.findByIdAndUpdate(req.body.postId,{
        $push:{Comment:Comment}
    },{
        new:true
    })
    return res.status(200).json({msg:"commented",result})
})

router.delete("/deletepost/:postId",requireLogin,async(req,res)=>{
    const {postId} = req.params
    const result =  await Post.findById(postId)
    if(!result){
        return res.status(422).json({msg:"there is no post regarding this id",result})
    }else{
        if(result.postedBy._id.toString() === req.Userdata._id.toString()){
            await result.deleteOne()
            return res.status(200).json({msg:"Post deleted by u"})
        }else{
            return res.status(422).json({msg:"u are not authorized user for this post"})
        }
    }
})


export default router