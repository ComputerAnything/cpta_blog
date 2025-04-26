import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import API from '../services/api';
import '../styles/Auth.css';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const Register = ({ onSwitchToLogin, setLoading }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    if (!recaptchaToken) {
      setMessage({ text: 'Please complete the reCAPTCHA.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await API.post('/register', { username, email, password, recaptchaToken });
      setRegistered(true);
      setMessage({
        text: 'Registration successful! Please check your email to verify your account before logging in.',
        type: 'success'
      });
    } catch (error) {
      setMessage({ text: 'Registration failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="auth-form">
        <h1>Registration Complete</h1>
        <p className="success-message">{message.text}</p>
        <button onClick={onSwitchToLogin}>Go to Login</button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      <h1>Register</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
      <div className="input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          className="show-password-btn"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>
      <div style={{ margin: '16px 0' }}>
        <ReCAPTCHA
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={token => setRecaptchaToken(token)}
        />
      </div>
      <button type="submit">Register</button>
      {message && (
        <p className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </p>
      )}
      <p className="switch-auth">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}>
          Login here
        </button>
      </p>
    </form>
  );
};

export default Register;
