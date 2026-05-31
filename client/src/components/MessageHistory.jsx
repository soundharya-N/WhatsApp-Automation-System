import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MessageHistory = ({ refreshTrigger, currentUser, socket }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get('/api/messages');
      let loadedMessages = response.data.data || [];
      if (currentUser?.mobileNumber) {
        loadedMessages = loadedMessages.filter((msg) => msg.fromNumber === currentUser.mobileNumber);
      }
      setMessages(loadedMessages);
      setCurrentPage(1);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.mobileNumber]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchMessages();
    }
  }, [refreshTrigger, fetchMessages]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleUpdate = (msg) => {
      try {
        if (currentUser?.mobileNumber && msg.fromNumber !== currentUser.mobileNumber) return;

        setMessages((prev) => {
          const exists = prev.find((m) => m._id === msg._id);
          if (exists) {
            return prev.map((m) => (m._id === msg._id ? msg : m));
          }
          return [msg, ...prev];
        });
      } catch (err) {
        console.error('Failed to handle socket message', err);
      }
    };

    socket.on('message_update', handleUpdate);

    return () => {
      socket.off('message_update', handleUpdate);
    };
  }, [currentUser?.mobileNumber, socket]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const totalPages = Math.max(1, Math.ceil(messages.length / pageSize));
  const currentMessages = messages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPage = (page) => {
    const normalizedPage = Math.min(Math.max(page, 1), totalPages);
    setCurrentPage(normalizedPage);
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-3">
          <div>
            <h2 className="h5 mb-1">Message History</h2>
            <p className="text-muted mb-0">Recent updates appear here as they happen.</p>
          </div>
          <div>
            <span className="badge bg-secondary">{messages.length} messages</span>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {loading && <div className="alert alert-info py-2">Loading messages...</div>}
        {!loading && messages.length === 0 && <div className="alert alert-light py-3">No messages yet. Send your first message.</div>}

        {!loading && messages.length > 0 && (
          <>
            <div className="table-responsive">
              <table className="table table-borderless align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Message</th>
                    <th scope="col">Response</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMessages.map((msg) => (
                    <tr key={msg._id}>
                      <td>{formatTime(msg.time)}</td>
                      <td>{msg.message}</td>
                      <td>{msg.response || 'Processing...'}</td>
                      <td>
                        <span className={`badge ${msg.status === 'SENT' ? 'bg-success' : msg.status === 'FAILED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {msg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 mt-4">
              <div className="text-muted">Page {currentPage} of {totalPages}</div>
              <div className="btn-group" role="group">
                <button type="button" className="btn btn-outline-primary" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                  Previous
                </button>
                <button type="button" className="btn btn-outline-primary" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageHistory;
