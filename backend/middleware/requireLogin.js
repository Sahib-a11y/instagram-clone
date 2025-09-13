import jwt from "jsonwebtoken"
import User from "../models/User.js"

export default async function requireLogin(req,res,next) {


    try {
    const {authorization} = req.headers

    if(!authorization){
       return res.status(401).json({error:"You  must be logged in"})
    }
    

    const token = authorization.replace("Bearer " , "")
    const payload =  jwt.verify(token,process.env.SECRETKEY)
    console.log(payload)
    const {id} = payload
    const user  =   await User.findById(payload.id).select("-password")
    if(!user){
        return res.status(401).json({error:"User Not Found"})
    }
    user.password = undefined
    req.Userdata  = user
    next()
    console.log(user);
    } catch (error) {
        console.error("Auth error:",error)
        return res.status(401).json({error:"you must be logged in"})
    }
}