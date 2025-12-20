import bcrypt from 'bcrypt'
import { Router } from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import requireLogin from '../middleware/requireLogin.js'

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
        
        console.log('═══════════════════════════════');
        console.log('🔵 SIGNIN ATTEMPT');
        console.log('Email received:', email);
        console.log('Password received:', password ? 'YES (length: ' + password.length + ')' : 'NO');
        console.log('Mongoose state:', mongoose.connection.readyState); // 1 = connected
        console.log('═══════════════════════════════');
        
        if (!email || !password) {
            console.log('❌ Missing credentials');
            return res.status(422).json({ error: "Please add email or password" })
        }

        console.log('🔍 Searching for user in database...');
        const savedUser = await User.findOne({ email: email })
        
        console.log('🔍 User found:', savedUser ? 'YES' : 'NO');
        if (savedUser) {
            console.log('   User ID:', savedUser._id);
            console.log('   User email:', savedUser.email);
            console.log('   User name:', savedUser.name);
            console.log('   Has password hash:', savedUser.password ? 'YES' : 'NO');
        }
        
        if (!savedUser) {
            console.log('❌ No user found with email:', email);
            
            // Debug: Check total users in DB
            const totalUsers = await User.countDocuments();
            console.log('📊 Total users in database:', totalUsers);
            
            // Debug: Check if email exists with different case
            const userCaseInsensitive = await User.findOne({ 
                email: { $regex: new RegExp(`^${email}$`, 'i') } 
            });
            if (userCaseInsensitive) {
                console.log('⚠️ FOUND USER WITH DIFFERENT CASE:', userCaseInsensitive.email);
            }
            
            return res.status(422).json({ error: "Invalid Email or Password" })
        }

        console.log('🔐 Comparing passwords...');
        const doMatch = await bcrypt.compare(password, savedUser.password)
        console.log('🔐 Password match result:', doMatch);
        
        if (doMatch) {
            console.log('✅ Authentication successful!');
            
            const token = jwt.sign({ id: savedUser._id }, process.env.SECRETKEY)
            console.log('✅ Token generated');
            
            const { password: userPassword, ...userWithoutPassword } = savedUser.toObject()
            
            console.log('✅ Sending response');
            res.json({
                token,
                user: userWithoutPassword
            })
        } else {
            console.log('❌ Password does not match');
            return res.status(422).json({ error: "Invalid Email or Password" })
        }

    } catch (err) {
        console.error("❌❌❌ SIGNIN ERROR ❌❌❌");
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
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