import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MessageForm = ({ onMessageSent, userMobile, socket }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [currentResponse, setCurrentResponse] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCurrentStatus('');
    setCurrentResponse('');

    if (!userMobile || !userMobile.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        message
      };

      const response = await axios.post('/api/messages/send-message', payload);
      const messageId = response.data.data.id;

      setCurrentMessageId(messageId);
      setProcessing(true);
      setCurrentStatus('Queued');
      setMessage('');
      onMessageSent(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentMessageId || !processing) {
      return;
    }

    const handleUpdate = (msg) => {
      if (!msg || msg._id !== currentMessageId) return;
      if (msg.status) {
        setCurrentStatus(msg.status);
      }
      if (msg.status === 'SENT' || msg.status === 'FAILED') {
        setProcessing(false);
        setCurrentResponse(msg.response || (msg.status === 'FAILED' ? 'Processing failed' : ''));
        onMessageSent(msg);
      }
    };

    if (socket) {
      socket.on('message_update', handleUpdate);
    }

    let active = true;
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`/api/messages/${currentMessageId}`);
        const msg = response.data.data;
        setCurrentStatus(msg.status || 'PENDING');

        if (msg.status === 'SENT' || msg.status === 'FAILED') {
          setProcessing(false);
          setCurrentResponse(msg.response || (msg.status === 'FAILED' ? 'Processing failed' : ''));
          active = false;
          onMessageSent(msg);
        }
      } catch (err) {
        console.error('Error fetching message status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(() => {
      if (active) {
        fetchStatus();
      }
    }, 3000);

    return () => {
      if (socket) {
        socket.off('message_update', handleUpdate);
      }
      clearInterval(interval);
    };
  }, [currentMessageId, processing, onMessageSent, socket]);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <h2 className="h5 mb-4">Send Message</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="mobileNumber" className="form-label">Mobile Number</label>
            <input
              type="tel"
              id="mobileNumber"
              className="form-control"
              value={userMobile}
              disabled
            />
          </div>

          <div className="mb-3">
            <label htmlFor="message" className="form-label">Message</label>
            <textarea
              id="message"
              className="form-control"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="5"
              disabled={loading}
            />
          </div>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Queuing...' : 'Send Message'}
          </button>
        </form>

        {currentMessageId && (
          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-semibold">Status</span>
              <span className={`badge ${currentStatus === 'SENT' ? 'bg-success' : currentStatus === 'FAILED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                {currentStatus}
              </span>
            </div>
            <div className="progress mb-3">
              <div
                className={`progress-bar ${processing ? 'progress-bar-striped progress-bar-animated' : 'bg-success'}`}
                role="progressbar"
                style={{ width: processing ? '60%' : '100%' }}
                aria-valuenow={processing ? 60 : 100}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            {!processing && currentResponse && (
              <div className="alert alert-light border">
                <strong>Response:</strong> {currentResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageForm;
