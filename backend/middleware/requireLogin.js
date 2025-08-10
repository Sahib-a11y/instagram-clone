import jwt from "jsonwebtoken"
import User from "../models/User.js"

export default async function requireLogin(req,res,next) {


    try {
    const {authorization} = req.headers

    if(!authorization){
       return res.status(401).json({error:"You  must be login"})
    }
    

    const token = authorization.replace("Bearer " , "")
    const payload =  jwt.verify(token,process.env.SECRETKEY)
    console.log(payload)
    const {id} = payload
    const user  =   await User.findById(id)
    user.password = undefined
    req.Userdata  = user
    next()
    console.log(user);
    } catch (error) {
        return res.status(401).json({error:"you must be login"})
    }
}