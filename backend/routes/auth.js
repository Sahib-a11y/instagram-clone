import bcrypt from 'bcrypt'
import { Router } from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import requireLogin from '../middleware/requireLogin.js'
import mongoose from 'mongoose'

const router = Router()


router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, pic } = req.body
        
        if (!email || !password || !name) {
            return res.status(422).json({ error: "Please fill all the fields" })
        }

        
        const existingUser = await User.findOne({ email: email })
        if (existingUser) {
            return res.status(422).json({ error: "User already exists with that email" })
        }

        
        const hashedPassword = await bcrypt.hash(password, 12)
        
        
        const user = new User({
            email,
            password: hashedPassword,
            name,
            pic: pic || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1YjmQy7iBycLxXrdwvrl38TG9G_LxSHC1eg&s"
        })

        await user.save()
        
        
        const token = jwt.sign({ id: user._id }, process.env.SECRETKEY)
        
        
        const { password: userPassword, ...userWithoutPassword } = user.toObject()
        
        res.json({
            message: "Successfully signed up",
            token,
            user: userWithoutPassword
        })

    } catch (err) {
        console.log("Signup error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
})


router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body
        
        if (!email || !password) {
            return res.status(422).json({ error: "Please add email or password" })
        }

        
        const savedUser = await User.findOne({ email: email })
        if (!savedUser) {
            return res.status(422).json({ error: "Invalid Email or Password" })
        }

        
        const doMatch = await bcrypt.compare(password, savedUser.password)
        if (doMatch) {
            
            const token = jwt.sign({ id: savedUser._id }, process.env.SECRETKEY)
            
            
            const { password: userPassword, ...userWithoutPassword } = savedUser.toObject()
            
            res.json({
                token,
                user: userWithoutPassword
            })
        } else {
            return res.status(422).json({ error: "Invalid Email or Password" })
        }

    } catch (err) {
        // console.log("Signin error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
})

router.get("/profile", requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.Userdata._id).select("-password")
        res.json({ user })
    } catch (error) {
        // console.log("Profile error:", error)
        return res.status(500).json({ error: "Internal server error" })
    }
})


router.put("/updateProfile", requireLogin, async (req, res) => {
    try {
        const { name, pic } = req.body
        const updatedUser = await User.findByIdAndUpdate(
            req.Userdata._id,
            { name, pic },
            { new: true }
        ).select("-password")
        
        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        })
    } catch (error) {
        // console.log("Update profile error:", error)
        return res.status(500).json({ error: "Internal server error" })
    }
})

export default router