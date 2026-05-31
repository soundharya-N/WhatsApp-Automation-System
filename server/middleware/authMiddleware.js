const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token missing or invalid'
    });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Normalize user id fields so controllers can use either userId or _id
    req.user = {
      ...decoded,
      userId: decoded.userId || decoded._id || decoded.id,
      _id: decoded.userId || decoded._id || decoded.id,
      id: decoded.userId || decoded._id || decoded.id
    };
    next();
  });
};

module.exports = {
  authenticateJWT
};
