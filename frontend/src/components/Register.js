import React, { useState } from 'react';
import API from '../services/api';
import '../styles/Auth.css';


const Register = ({ onSwitchToLogin, setLoading }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true); // Show loading screen
    try {
      await API.post('/register', { username, email, password });
      setMessage({ text: 'Registration successful! Redirecting to login...', type: 'success' });
      setTimeout(() => {
        onSwitchToLogin();
      }, 1500);
    } catch (error) {
      setMessage({ text: 'Registration failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false); // Hide loading screen
    }
  };

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
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="input-container">
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
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
