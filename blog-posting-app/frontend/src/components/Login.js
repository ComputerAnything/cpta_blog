import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Auth.css';


const Login = ({ onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', username);
      localStorage.setItem('userId', response.data.user_id);
      navigate('/posts');
    } catch (error) {
      setMessage('Login failed. Please check your credentials.');
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <h1>Login</h1>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
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
