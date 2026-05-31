require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { messageWorker } = require('./queue/messageQueue');
const { initSocket } = require('./sockets/socketService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/message_chat';
    await mongoose.connect(uri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);
server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ API endpoint: http://localhost:${PORT}/api/messages/send-message`);
  console.log(`✓ Webhook endpoint: http://localhost:${PORT}/api/messages/webhook/delivery-status`);
  console.log(`📦 Message queue worker initialized`);
  console.log(`⚙️  Processing mode: QUEUE ONLY`);
  console.log(`ℹ️  Messages process asynchronously with status updates to webhook/database`);
});
