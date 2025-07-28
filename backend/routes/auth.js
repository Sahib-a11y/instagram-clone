import { Router } from "express";
import bcrypt from 'bcrypt'
import User from "../models/User.js";
import jwt from "jsonwebtoken";
const router =Router()

router.post("/signup",async(req,res) =>{
    const {name,email,password,pic} =req.body

    if(!email|| !name || !password){
    return res.status(422).json({error:"Please fill  all the fields "})
}else{
    const savedUser =  await User.findOne({email})
    if(savedUser){
        return res.status(422).json({error:"Email Already Exists"})
    }else{
        const encryptedPassword = await bcrypt.hash(password,12)
        const newUser = new User({
            name,
            email,
            password:encryptedPassword,
            pic
        })
        await newUser.save()
        return res.status(200).json({msg:"User Added Succesfully"})
      }
}
})

router.post("/login",async(req,res) => {
    try {
        const{email,password}= req.body

        if (!email || !password) {
            return res.status(422).json({error:"Please fill all the fields"})
        } else {
            const userFOundOrNot =await User.findOne({email})
            if (userFOundOrNot) {
                const userValidorNot = await bcrypt.compare(password,userFOundOrNot.password)
                    if (userValidorNot) {
                        const token =  await jwt.sign({id:userFOundOrNot._id},process.env.SECRETKEY)
                        return res.status(200).json({msg:'User Logged In',token})
                    } else {
                        return res.status(422).json({error:"Invalid Password"})
                    }
                
            } else {
                return res.status(422).json({error:"Invalid Email"})
            }
        }
        
    } catch (error) {
        console.log("Error",error)
    }
})





export default router