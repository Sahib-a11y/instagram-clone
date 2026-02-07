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
import chatrouter from './routes/chat.js';

// Note: Socket.IO disabled for Vercel serverless deployment
// const SocketServer = require('./socket/socketServer.js');
// const { createServer } = require('http');

const app = express()

// ✅ Fixed CORS config for Vercel deployment - Allow specific origins
const corsOptions = {
    origin: ['https://instagram-clone-phi-dusky.vercel.app', 'http://localhost:3000'], // Allow frontend and local dev
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
        limits: { fileSize: 50 * 1024 * 1024 },
        abortOnLimit: true
    })
);

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

async function DBConnect() {
    try {
        await mongoose.connect(process.env.MONGOURI)
        console.log('DB connected Successfully')
    } catch (error) {
        console.log("MongoDB connection error: ", error)
        process.exit(1)
    }
}

app.get('/', (req, res) => {
    res.json({
        message: 'SocialApp Backend is running!',
        status: 'success',
        timestamp: new Date().toISOString()
    })
})

app.use(Authrouter)
app.use(Postrouter)
app.use(Userrouter)
app.use(storyrouter)
app.use(uploadrouter)
app.use(chatrouter)

// Note: Socket.IO disabled for Vercel serverless deployment
// app.set('socketio', socketServer.getIO());  //socket for routes if need

app.use((err, req, res, next) => {
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    })
})

// Connect to database
DBConnect()

// Vercel serverless functions don't need explicit server.listen()
// The app is exported and Vercel handles the server setup
export default app
