import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, setGuest, setLoading, closeModal, openModal } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import '../styles/Auth.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const response = await API.post('/login', { identifier, password });
      dispatch(setCredentials({
        user: {
          username: response.data.username,
          userId: response.data.user_id,
        },
        token: response.data.access_token,
      }));
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('userId', response.data.user_id);
      localStorage.removeItem('guest');
      setMessage('');
      dispatch(closeModal());
      navigate('/posts');
    } catch (error) {
      setMessage(error.response?.data?.msg || 'Login failed. Please check your credentials.');
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
    dispatch(closeModal());
    navigate('/posts');
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
          className="toggle-password-btn"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>
      <button type="submit" className="auth-btn">Login</button>
      <button
        type="button"
        className="guest-btn"
        onClick={handleGuest}
      >
        Continue as Guest
      </button>
      {message && <p className="error-message">{message}</p>}
      <p className="switch-auth">
        Don't have an account?{' '}
        <button type="button" className='switch-auth-btn' onClick={() => dispatch(openModal('register'))}>
          Register here
        </button>
      </p>
    </form>
  );
};

export default Login;
