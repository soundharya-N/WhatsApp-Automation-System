const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';
const JWT_EXPIRES_IN = '8h';
const mobileRegex = /^[0-9]{10,15}$/;

const register = async (req, res) => {
  try {
    const { username, mobileNumber, password } = req.body;

    if (!username || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, mobile number, and password are required'
      });
    }

    if (!mobileRegex.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be 10 to 15 digits'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ mobileNumber }, { username }]
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.username === username
          ? 'Username already registered'
          : 'Mobile number already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      mobileNumber,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username, mobileNumber: user.mobileNumber },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          mobileNumber: user.mobileNumber
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, mobileNumber: user.mobileNumber },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          mobileNumber: user.mobileNumber
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login
};
