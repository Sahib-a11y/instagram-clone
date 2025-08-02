import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import 'dotenv/config' 
import router from './routes/auth.js'

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

 app.use(router)
 app.use(cors({
    origin:"http://localhost:3000",
    credentials: true
 }))

 const PORT = process.env.PORT || 5000

 app.listen(PORT,()=>console.log(`Server is running at ${PORT}`))