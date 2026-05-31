import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import MessageForm from './components/MessageForm';
import MessageHistory from './components/MessageHistory';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

const initialAuthState = {
  username: '',
  mobileNumber: '',
  password: ''
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState(user ? 'dashboard' : 'login');
  const [authForm, setAuthForm] = useState(initialAuthState);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [socket, setSocket] = useState(null);

  const getPageFromPath = () => {
    const path = window.location.pathname;
    if (path === '/register') return 'register';
    if (path === '/dashboard') return 'dashboard';
    return 'login';
  };

  const routeToPage = (targetPage) => {
    const newPath = targetPage === 'register'
      ? '/register'
      : targetPage === 'dashboard'
        ? '/dashboard'
        : '/login';

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }

    setPage(targetPage);
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socketServerUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    console.log('Attempting socket connection to', socketServerUrl);
    const socketClient = io(socketServerUrl, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      path: '/socket.io'
    });

    socketClient.on('connect', () => {
      console.log('Socket connected to', socketServerUrl);
    });

    socketClient.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message || error);
    });

    socketClient.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socketClient.on('reconnect_attempt', (attempt) => {
      console.info('Socket reconnect attempt:', attempt);
    });

    socketClient.on('message_update', (msg) => {
      console.log('App-level socket message_update received:', msg);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!token && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [token, socket]);

  useEffect(() => {
    const pathPage = getPageFromPath();

    if (user) {
      if (pathPage === 'login' || pathPage === 'register') {
        routeToPage('dashboard');
      } else {
        setPage('dashboard');
      }
    } else {
      if (pathPage === 'register') {
        routeToPage('register');
      } else {
        routeToPage('login');
      }
    }
  }, [user]);

  useEffect(() => {
    const handlePopState = () => {
      const pathPage = getPageFromPath();

      if (!user && pathPage === 'dashboard') {
        routeToPage('login');
        return;
      }

      if (user && pathPage === 'login') {
        routeToPage('dashboard');
        return;
      }

      setPage(pathPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleAuthInput = (e) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      const response = await axios.post('/api/auth/login', {
        username: authForm.username,
        password: authForm.password
      });

      const { token: authToken, user: authUser } = response.data.data;
      setToken(authToken);
      setUser(authUser);
      routeToPage('dashboard');
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));
      setAuthForm(initialAuthState);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your connection and try again.';
      setAuthError(errorMessage);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      await axios.post('/api/auth/register', {
        username: authForm.username,
        mobileNumber: authForm.mobileNumber,
        password: authForm.password
      });

      routeToPage('login');
      setAuthForm(initialAuthState);
      setAuthSuccess('Registration successful. Please login with your new account.');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please check your connection and try again.';
      setAuthError(errorMessage);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    routeToPage('login');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthForm(initialAuthState);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const authPage = page === 'login' ? (
    <Login
      authForm={authForm}
      onInputChange={handleAuthInput}
      onSubmit={handleLogin}
      authError={authError}
      authSuccess={authSuccess}
      showPassword={showPassword}
      togglePasswordVisibility={togglePasswordVisibility}
      onSwitchToRegister={() => { routeToPage('register'); setAuthError(''); }}
    />
  ) : (
    <Register
      authForm={authForm}
      onInputChange={handleAuthInput}
      onSubmit={handleRegister}
      authError={authError}
      authSuccess={authSuccess}
      showPassword={showPassword}
      togglePasswordVisibility={togglePasswordVisibility}
      onSwitchToLogin={() => { routeToPage('login'); setAuthError(''); }}
    />
  );

  const handleMessageSent = (newMessage) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="app bg-light min-vh-100">
      <header className="app-header py-3 shadow-sm bg-white border-bottom">
        <div className="container-fluid">
          <div className={`d-flex align-items-center ${user ? 'justify-content-between' : 'justify-content-center'}`}>
            {user && <div style={{ width: '120px' }}></div>}
            <h1 className="h4 mb-0 flex-grow-1 text-center">WhatsApp Automation System</h1>
            {user && (
              <button className="btn btn-outline-danger btn-sm" type="button" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-body py-4">
        <div className="container-fluid">
          {!user ? (
            <div className="row justify-content-center">
              <div className="col-12 col-md-8 col-lg-5">
                {authPage}
              </div>
            </div>
          ) : (
            <div className="row gx-4 gy-4">
              <div className="col-12 col-xl-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body d-flex flex-column gap-3">
                    <div className="border-bottom pb-3">
                      <h2 className="h5 mb-1">Welcome back, {user.username}</h2>
                      <p className="text-muted mb-0">Mobile number: <span className="fw-semibold">{user.mobileNumber}</span></p>
                    </div>
                    <MessageForm onMessageSent={handleMessageSent} userMobile={user.mobileNumber} socket={socket} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-8">
                <MessageHistory refreshTrigger={refreshTrigger} currentUser={user} socket={socket} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
