import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

import connectDB from './config/database.js';
import { initializeFirebase } from './config/firebase.js';
import { initializeSocket } from './config/socket.js';
import { errorHandler } from './middleware/error.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import donationRoutes from './routes/donation.routes.js';
import userRoutes from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

// Load env vars
dotenv.config();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Connect to Database
connectDB();

// Initialize Firebase Admin
initializeFirebase();

// Initialize Socket.io
initializeSocket(httpServer);

// Middleware
app.use(helmet());

const rawOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOrigins = [
    rawOrigin.replace(/\/+$/, ''),           // without slash
    rawOrigin.replace(/\/+$/, '') + '/'      // with slash
];

console.log('CORS Origins allowed:', corsOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (corsOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Smart Food Donation API is running...');
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
