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

  const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: token required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: invalid token'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    if (user?.mobileNumber) {
      socket.join(`user_${user.mobileNumber}`);
    }

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
};

const sendEvent = (eventName, data, targetMobile) => {
  if (!io) return;
  if (targetMobile) {
    io.to(`user_${targetMobile}`).emit(eventName, data);
  } else {
    io.emit(eventName, data);
  }
};

module.exports = {
  initSocket,
  sendEvent
};
