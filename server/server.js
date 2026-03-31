const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const flowRoutes = require('./routes/flowRoutes');
const progressRoutes = require('./routes/progressRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const startCronJobs = require('./utils/cronJobs');
const webpush = require('web-push');

dotenv.config();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/flow', flowRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/upload', uploadRoutes);

// Cron jobs initialization deferred to allow socket injection

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('send_message', (data) => {
    // If admin responds to user, emit to user's room
    if (data.receiverId && data.receiverId !== 'admin') {
      io.to(data.receiverId).emit('receive_message', data);
    } else {
      // User sending to admin => emit to a general admin channel, or let admin join all
      io.emit('receive_admin_message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start Cron Jobs with Socket instance
startCronJobs(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
