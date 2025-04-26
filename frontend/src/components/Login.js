import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/Auth.css';

const Login = ({ onSwitchToRegister, setLoading }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true); // Show loading screen
    try {
      const response = await API.post('/login', { identifier, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('userId', response.data.user_id);
      navigate('/posts');
    } catch (error) {
      const backendMsg = error.response?.data?.msg;
      if (backendMsg === "Please verify your email before logging in.") {
        setMessage(
          <>
            Please verify your email before logging in.
            <br />
            <button
              type="button"
              className="resend-verification-btn"
              onClick={async () => {
                try {
                  await API.post('/resend-verification', { identifier });
                  setMessage("Verification email sent! Please check your inbox.");
                } catch {
                  setMessage("Failed to resend verification email. Please try again later.");
                }
              }}
            >
              Resend Verification Email
            </button>
          </>
        );
      } else if (backendMsg) {
        setMessage(backendMsg);
      } else {
        setMessage('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <div className="input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>
      <button type="submit">Login</button>
      {message && <p className="error-message">{message}</p>}
      <p className="switch-auth">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister}>
          Register here
        </button>
      </p>
    </form>
  );
};

export default Login;
