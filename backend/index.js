import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import 'dotenv/config';

import Authrouter from "./routes/auth.js"
import Postrouter from "./routes/post.js"
import Userrouter from './routes/user.js'
import storyrouter from './routes/story.js'
import uploadrouter from "./routes/upload.js"
import fileUpload from 'express-fileupload';

const app = express()



 app.use(cors())
 
 app.use(
    fileUpload({
        useTempFiles:true,
        tempFileDir:"/tmp/",
        limits:{fileSize:5*1024*1024},
        abortOnLimit: true
    })
 );
  
 app.use(express.json({limit: '50mb'}))
 app.use(express.urlencoded({extended: true, limit:'50mb'}))

 async function DBConnect() {  
    try {
        const res=await mongoose.connect(process.env.MONGOURI)
        console.log('DB connected Succesfully')
    } catch (error) {
        console.log("MongoDB coonection error: ",error)
        process.exit(1)
    }
 }

 app.get('/', (req,res) => {
    res.json({
        message: 'SocialApp Backend is running!',
        status:'success',
        timestamp: new Date().toISOString()
    })
 })

 


 app.use(Authrouter)
 app.use(Postrouter)
 app.use(Userrouter)
 app.use(storyrouter)
 app.use(uploadrouter)

 app.use((err, req, res,next) => {
    console.error('Server Error:', err)
    res.status(500).json({
        error: 'Index Internal Server Error',
        message: err.message
    })
 })




 DBConnect()


 const PORT = process.env.PORT || 5000   



 app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
    console.log(`Frontend should connect to ${PORT}`)
 })


 export default app