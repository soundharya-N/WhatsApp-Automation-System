const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (server) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST']
    }
  });
  console.log('Socket server initialized');

  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      console.warn('Socket auth failed: token required');
      return next(new Error('Authentication error: token required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.warn('Socket auth failed: invalid token');
        return next(new Error('Authentication error: invalid token'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    console.log('Socket client connected', {
      socketId: socket.id,
      user: user ? { mobileNumber: user.mobileNumber, username: user.username } : null
    });

    if (user?.mobileNumber) {
      socket.join(`user_${user.mobileNumber}`);
    }

    socket.on('disconnect', (reason) => {
      console.log('Socket client disconnected', { socketId: socket.id, reason });
    });
  });

  return io;
};

const sendEvent = (eventName, data, targetMobile) => {
  if (!io) return;
  const payload = data && typeof data.toJSON === 'function' ? data.toJSON() : data;

  console.log('Socket emit', {
    eventName,
    targetMobile,
    payloadId: payload?._id || payload?.id,
    payloadStatus: payload?.status
  });

  if (targetMobile) {
    io.to(`user_${targetMobile}`).emit(eventName, payload);
  } else {
    io.emit(eventName, payload);
  }
};

module.exports = {
  initSocket,
  sendEvent
};
