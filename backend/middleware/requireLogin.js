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
    const {_id} = payload
    const user  =   await User.findById(_id)
    console.log(user);2
    } catch (error) {
        return res.status(401).json({error:"you must be login"})
    }
}