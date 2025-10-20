import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoading, setGuest } from '../../redux/slices/authSlice';
// import ReCAPTCHA from 'react-google-recaptcha';
import API from '../../services/api';
import '../../styles/Auth.css';

// const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
// console.log('RECAPTCHA_SITE_KEY:', RECAPTCHA_SITE_KEY);

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  // const [recaptchaToken, setRecaptchaToken] = useState('');
  const [registered, setRegistered] = useState(false);
  const dispatch = useDispatch();
  const [honeypot, setHoneypot] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    // if (!recaptchaToken) {
    //   setMessage({ text: 'Please complete the reCAPTCHA.', type: 'error' });
    //   return;
    // }
    dispatch(setLoading(true));
    try {
      await API.post('/register', { username, email, password });
      setRegistered(true);
      setMessage({
        text: 'Registration successful! Please check your email to verify your account.',
        type: 'success'
      });
    } catch (error) {
      setMessage({ text: 'Registration failed. Please try again.', type: 'error' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGuest = () => {
    dispatch(setGuest());
    localStorage.setItem('guest', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setMessage('');
    navigate('/posts');
  };

  if (registered) {
    return (
      <div className="auth-form">
        <h1>Registration Complete</h1>
        <p className="success-message">{message.text}</p>
        <button onClick={() => {
          if (typeof window !== 'undefined' && window.onSwitchToLogin) {
            window.onSwitchToLogin();
          }
        }}>Go to Login</button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={e => setHoneypot(e.target.value)}
        style={{ display: 'none' }}
        autoComplete="off"
        tabIndex="-1"
      />
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
          className="toggle-password-btn"
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
          className="toggle-password-btn"
          type="button"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>
      <div style={{ margin: '16px 0' }}>
        {/* <ReCAPTCHA
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={token => setRecaptchaToken(token)}
        /> */}
      </div>
      <button type="submit" className="auth-btn">Register</button>
      <button
        type="button"
        className="guest-btn"
        onClick={handleGuest}
      >
        Continue as Guest
      </button>
      {message && (
        <p className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </p>
      )}
    </form>
  );
};

export default Register;
