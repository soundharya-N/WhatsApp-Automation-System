import React from 'react';

const Login = ({
  authForm,
  onInputChange,
  onSubmit,
  authError,
  authSuccess,
  showPassword,
  togglePasswordVisibility,
  onSwitchToRegister
}) => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="mb-3 text-center">
          <h2 className="h4 mb-2">Login</h2>
          <p className="text-muted mb-0">Access your account to start sending messages.</p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-control"
              placeholder="Enter username"
              value={authForm.username}
              onChange={onInputChange}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
                value={authForm.password}
                onChange={onInputChange}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {authError && <div className="alert alert-danger py-2">{authError}</div>}
          {authSuccess && <div className="alert alert-success py-2">{authSuccess}</div>}

          <button type="submit" className="btn btn-primary w-100 py-2">
            Login
          </button>

          <div className="mt-3 text-center">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={onSwitchToRegister}
            >
              Don&apos;t have an account? Register here.
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
