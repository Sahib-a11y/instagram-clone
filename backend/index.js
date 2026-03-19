 import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import 'dotenv/config';
import { createServer } from 'http';

import Authrouter from "./routes/auth.js"
import Postrouter from "./routes/post.js"
import Userrouter from './routes/user.js'
import storyrouter from './routes/story.js'
import feedRouter from './routes/feed.js'
import uploadrouter from "./routes/upload.js"
import notificationrouter from './routes/notification.js'
import fileUpload from 'express-fileupload';
import chatrouter from './routes/chat.js';
import SocketServer from './socket/socketServer.js';

const app = express()

// Updated CORS configuration to allow both localhost and production URLs
const allowedOrigins = [
    'https://instagram-clone-phi-dusky.vercel.app', // Production URL
    'http://localhost:3000', // Development URL
    'http://localhost:3001', // Alternative development URL
    'http://localhost:3002' // Additional development URL
];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
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

// Additional CORS headers middleware for compatibility
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    next();
});

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

app.use('/auth', Authrouter)
app.use(Postrouter)
app.use(Userrouter)
app.use('/story', storyrouter)
app.use('/feed', feedRouter)
app.use(uploadrouter)
app.use(chatrouter)
app.use('/notification', notificationrouter)

// Initialize Socket.IO for local development
if (process.env.NODE_ENV !== 'production') {
  // Socket.IO will be initialized when server starts
} else {
  // Note: Socket.IO disabled for Vercel serverless deployment
  // app.set('socketio', socketServer.getIO());  //socket for routes if need
}

app.use((err, req, res, next) => {
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    })
})

// Connect to database
DBConnect()

// For local development, start the server with Socket.IO
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  const server = createServer(app);
  const socketServer = new SocketServer(server);

  // Make io accessible globally for notifications
  app.set('io', socketServer.getIO());

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO`);
  });
}

// Vercel serverless functions don't need explicit server.listen()
// The app is exported and Vercel handles the server setup
export default app
