const Message = require('../models/Message');
const { addMessageToQueue } = require('../queue/messageQueue');
const axios = require('axios');

const internalWebhookUrl = process.env.INTERNAL_WEBHOOK_URL || `http://localhost:${process.env.PORT || 5000}/api/messages/webhook/delivery-status`;

// POST /api/messages/send-message
const sendMessage = async (req, res) => {
  try {
const { message } = req.body;
  const fromNumber = req.user?.mobileNumber;

  // Validation
  if (!fromNumber || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mobile number and message are required' 
    });
  }

  // Create new message record with PENDING status
  let messageRecord = new Message({
    fromNumber,
    message,
    status: 'PENDING'
    });

    // Save to database
    await messageRecord.save();

    // Add message to queue for async processing (must succeed)
    console.log(`Queueing message ${messageRecord._id}`);
    try {
      const job = await addMessageToQueue(
        messageRecord._id,
        message,
        fromNumber
      );

      // Return immediately with PENDING status when queued
      res.status(200).json({
        success: true,
        message: 'Message queued for processing',
        data: {
          id: messageRecord._id,
          fromNumber: messageRecord.fromNumber,
          message: messageRecord.message,
          status: messageRecord.status,
          time: messageRecord.time,
          queueJobId: job && job.id ? job.id : null
        }
      });
    } catch (err) {
      console.error('Queue error:', err.message);
      // Keep the DB entry and notify internal webhook about failure so it updates status/response
      try {
        await axios.post(internalWebhookUrl, {
          messageId: messageRecord._id,
          status: 'FAILED',
          response: 'internel error try after some time',
          error: err.message,
          timestamp: new Date()
        }, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✓ Internal failure webhook invoked for message ${messageRecord._id}`);
      } catch (webhookErr) {
        console.error('Failed to call internal webhook after queue error:', webhookErr.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Message created; queue unavailable. Status will be updated via webhook.',
        data: {
          id: messageRecord._id,
          fromNumber: messageRecord.fromNumber,
          message: messageRecord.message,
          status: messageRecord.status,
          time: messageRecord.time
        }
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// GET /api/messages - Get all messages
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ time: -1 });
    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// GET /api/messages/:id - Get a single message
const getMessageById = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getAllMessages,
  getMessageById
};
