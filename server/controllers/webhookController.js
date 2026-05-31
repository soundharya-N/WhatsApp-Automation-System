const Message = require('../models/Message');
const socketService = require('../sockets/socketService');

// POST /api/messages/webhook/delivery-status
const handleWebhookEvent = async (req, res) => {
  try {
    const { messageId, status, response, error, timestamp } = req.body;

    console.log('Webhook received:', {
      messageId,
      status,
      response,
      error,
      timestamp,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress
    });

    // Validation
    if (!messageId || !status) {
      return res.status(400).json({
        success: false,
        message: 'messageId and status are required'
      });
    }

    // Valid status values
    const validStatuses = ['PENDING', 'SENT', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update the message
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message status from webhook
    message.status = status;
    if (response) {
      message.response = response;
    } else if (status === 'FAILED') {
      message.response = 'failed to respond';
    }
    await message.save();

    try {
      socketService.sendEvent('message_update', message, message.fromNumber);
    } catch (socketError) {
      console.warn('Failed to send socket update from webhook:', socketError.message);
    }

    console.log(`✓ Message ${messageId} updated via webhook - Status: ${status}`);

    res.status(200).json({
      success: true,
      message: 'Message status updated from webhook',
      data: {
        id: message._id,
        status: message.status,
        response: message.response,
        timestamp: timestamp || new Date()
      }
    });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

module.exports = {
  handleWebhookEvent
};
