import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import 'dotenv/config' 
import Authrouter from "./routes/auth.js"
import Postrouter from "./routes/post.js"
import Userrouter from './routes/user.js'
import storyrouter from './routes/story.js'

const app = express()
 app.use(cors())
 app.use(express.json())

 async function DBConnect() {
    try {
        const res = await mongoose.connect(process.env.MONGOURI)
        console.log('DB connected Succesfully')
    } catch (error) {
        console.log("error",error)
        
    }
 }

 DBConnect()

 app.use(Authrouter)
 app.use(Postrouter)
 app.use(Userrouter)
 app.use(cors({
    origin:"http://localhost:3000",
    credentials: true
 }))
 app.use("/api/stories", storyrouter)


 const PORT = process.env.PORT || 5000

 app.listen(PORT,()=>console.log(`Server is running at ${PORT}`))