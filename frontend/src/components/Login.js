import React, { useState } from 'react';
import API from '../services/api';
import '../styles/Auth.css';


const Login = ({ onSwitchToRegister, setLoading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true); // Show loading screen
    try {
      const response = await API.post('/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', username);
      localStorage.setItem('userId', response.data.user_id);
      window.location.href = '/posts'; // Redirect to posts page
    } catch (error) {
      setMessage('Login failed. Please check your credentials.');
    } finally {
      setLoading(false); // Hide loading screen
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <h1>Login</h1>
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
