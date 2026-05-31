import React from 'react';

const Register = ({
  authForm,
  onInputChange,
  onSubmit,
  authError,
  authSuccess,
  showPassword,
  togglePasswordVisibility,
  onSwitchToLogin
}) => {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        <div className="mb-3 text-center">
          <h2 className="h4 mb-2">Register</h2>
          <p className="text-muted mb-0">Create an account to begin sending messages.</p>
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
            <label htmlFor="mobileNumber" className="form-label">Mobile Number</label>
            <input
              id="mobileNumber"
              name="mobileNumber"
              type="tel"
              className="form-control"
              placeholder="Enter mobile number"
              value={authForm.mobileNumber}
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
            Create account
          </button>

          <div className="mt-3 text-center">
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={onSwitchToLogin}
            >
              Already have an account? Login here.
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
