import { Server } from 'socket.io';
import { admin } from './firebase.js';
import User from '../models/User.js';

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: true, // Reflects the origin if it matches
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Verify Firebase token
            const decodedToken = await admin.auth().verifyIdToken(token);
            const user = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.userType = user.userType;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    // Connection handler
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId} (${socket.userType})`);

        // Join user-specific room
        socket.join(socket.userId);

        // Disconnect handler
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });

    console.log('Socket.io initialized');
    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export { initializeSocket, getIO };
