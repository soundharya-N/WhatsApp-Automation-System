const express = require('express');
const {
  sendMessage,
  getAllMessages,
  getMessageById
} = require('../controllers/messageController');
const {
  handleWebhookEvent
} = require('../controllers/webhookController');
const { authenticateJWT } = require('../middleware/authMiddleware');

const router = express.Router();

// POST endpoint to send message
router.post('/send-message', authenticateJWT, sendMessage);

// GET all messages
router.get('/', getAllMessages);

// GET single message by ID
router.get('/:id', getMessageById);

// POST webhook endpoint for delivery updates
router.post('/webhook/delivery-status', handleWebhookEvent);

module.exports = router;
