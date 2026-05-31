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

  // create new socket for every client connection and log it
  io.on('connection', (socket) => {
    const { user } = socket;
    console.log('Socket client connected', {
      socketId: socket.id,
      user: user ? { userId: user.userId || user._id, mobileNumber: user.mobileNumber, username: user.username } : null
    });

    if (user?.userId || user?._id) {
      const uid = user.userId || user._id;
      socket.join(`user_${uid}`);
    }

    socket.on('disconnect', (reason) => {
      console.log('Socket client disconnected', { socketId: socket.id, reason });
    });
  });

  return io;
};

//send event to frontend via socket
const sendEvent = (eventName, data, targetMobile) => {
  if (!io) return;
  const payload = data && typeof data.toJSON === 'function' ? data.toJSON() : data;

  console.log('Socket emit', {
    eventName,
    targetMobile,
    payloadId: payload?._id || payload?.id,
    payloadStatus: payload?.status,
    payloadUserId: payload?.userId
  });

  // Emit by userId room if available, otherwise use mobile room or global emit
  if (payload?.userId) {
    io.to(`user_${payload.userId}`).emit(eventName, payload);
    return;
  }

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
