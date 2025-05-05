import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setLoading, openModal } from '../../redux/slices/authSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import API from '../../services/api';
import '../../styles/Auth.css';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
// console.log('RECAPTCHA_SITE_KEY:', RECAPTCHA_SITE_KEY);

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [registered, setRegistered] = useState(false);
  const dispatch = useDispatch();

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
    dispatch(setLoading(true));
    try {
      await API.post('/api/register', { username, email, password, recaptchaToken });
      setRegistered(true);
      setMessage({
        text: 'Registration successful! Please check your email to verify your account before logging in.',
        type: 'success'
      });
    } catch (error) {
      setMessage({ text: 'Registration failed. Please try again.', type: 'error' });
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (registered) {
    return (
      <div className="auth-form">
        <h1>Registration Complete</h1>
        <p className="success-message">{message.text}</p>
        <button onClick={() => dispatch(openModal('login'))}>Go to Login</button>
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
        <ReCAPTCHA
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={token => setRecaptchaToken(token)}
        />
      </div>
      <button type="submit" className="auth-btn">Register</button>
      {message && (
        <p className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </p>
      )}
      <p className="switch-auth">
        Already have an account?{' '}
        <button type="button" className='switch-auth-btn' onClick={() => dispatch(openModal('login'))}>
          Login here
        </button>
      </p>
    </form>
  );
};

export default Register;
