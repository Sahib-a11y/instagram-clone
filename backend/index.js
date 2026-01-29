import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { createServer } from 'http'
import 'dotenv/config';

import Authrouter from "./routes/auth.js"
import Postrouter from "./routes/post.js"
import Userrouter from './routes/user.js'
import storyrouter from './routes/story.js'
import uploadrouter from "./routes/upload.js"
import fileUpload from 'express-fileupload';
import chatrouter from './routes/chat.js';
import SocketServer from './socket/socketServer.js';

const app = express()
const server = createServer(app)

const socketServer = new SocketServer(server);

// ✅ Fixed CORS config for Vercel deployment
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'https://instagram-clone-mmvnz20nq-gursahib-singhs-projects.vercel.app',
            'https://instagram-clone.vercel.app',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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

app.set('socketio', socketServer.getIO());  //socket for routes if need

app.use((err, req, res, next) => {
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    })
})

DBConnect()

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`)
    console.log(`Frontend should connect to ${PORT}`)
})

export default app
