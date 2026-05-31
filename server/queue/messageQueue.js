const { Queue, Worker } = require('bullmq');
const { createClient } = require('redis');
const axios = require('axios');
const { getRealLLMResponse } = require('../services/llmService');

// Redis connection config
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};
const redisUrl = process.env.REDIS_URL || `redis://${connection.host}:${connection.port}`;

let redisAvailable = false;
let messageQueue = null;
let messageWorker = null;
let queueInitPromise = null;
let queueInitCompleted = false;

const internalWebhookUrl = process.env.INTERNAL_WEBHOOK_URL || `http://localhost:${process.env.PORT || 5000}/api/messages/webhook/delivery-status`;

const createRedisConnection = async () => {
  const client = createClient({ url: redisUrl });
  client.on('error', (err) => {
    console.error('Redis client error:', err ? err.message || err : 'unknown Redis error');
  });
  console.log(`Connecting to Redis at ${redisUrl}`);
  await client.connect();
  console.log('✓ Redis client connected');
  await client.ping();
  console.log('✓ Redis ping successful');
  await client.disconnect();
};

const processJobData = async ({ messageId, message, fromNumber }) => {
  try {
    console.log(`Processing message ${messageId}...`);

    const llmResponse = await getRealLLMResponse(message);
    console.log(`✓ LLM response received for message ${messageId}`);

    try {
      await axios.post(internalWebhookUrl, {
        messageId,
        status: 'SENT',
        response: llmResponse,
        timestamp: new Date()
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✓ Internal webhook invoked for message ${messageId}`);
    } catch (webhookError) {
      console.error(`✗ Internal webhook failed for message ${messageId}:`, webhookError.message);
    }

    return { success: true, messageId, response: llmResponse };
  } catch (error) {
    console.error(`✗ Processing failed for message ${messageId}:`, error.message);

    try {
      await axios.post(internalWebhookUrl, {
        messageId,
        status: 'FAILED',
        response: 'failed to respond',
        error: error.message,
        timestamp: new Date()
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`✓ Internal failure webhook invoked for message ${messageId}`);
    } catch (webhookError) {
      console.error(`✗ Internal failure webhook failed for message ${messageId}:`, webhookError.message);
    }

    throw error;
  }
};

const initializeQueue = async () => {
  try {
    await createRedisConnection();
    redisAvailable = true;

    messageQueue = new Queue('messages', { connection });

    messageWorker = new Worker(
      'messages',
      async (job) => processJobData(job.data),
      { connection }
    );

    messageQueue.on('completed', (job) => {
      console.log(`✓ Job ${job.id} completed successfully`);
    });

    messageQueue.on('failed', (job, err) => {
      console.error(`✗ Job ${job.id} failed:`, err.message);
    });

    console.log('✓ BullMQ queue initialized with Redis');
  } catch (error) {
    redisAvailable = false;
    console.warn('⚠️ Redis unavailable. Messages cannot be queued until Redis is available.');
    console.warn(error.message);
  } finally {
    queueInitCompleted = true;
  }
};

queueInitPromise = initializeQueue();

// Function to add message to queue
const addMessageToQueue = async (messageId, message, fromNumber) => {
  const jobData = {
    messageId,
    message,
    fromNumber
  };

  if (queueInitPromise && !queueInitCompleted) {
    await queueInitPromise;
  }
  if (!redisAvailable || !messageQueue) {
    console.error(`✗ Queue unavailable. Rejecting message ${messageId} for processing.`);
    throw new Error('Queue unavailable');
  }

  try {
    const job = await messageQueue.add('process-message', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
    console.log(`✓ Message added to queue with job ID: ${job.id}`);
    return job;
  } catch (error) {
    console.error('Error adding message to queue:', error.message);
    throw error;
  }
};

module.exports = {
  messageQueue,
  messageWorker,
  addMessageToQueue
};
