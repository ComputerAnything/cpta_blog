import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css';


// TODO: When a user registers, the user should be redirected to the login page with a success message, there is no redirection.
// Also, the color of the success message is red instead of green.
const Register = ({ onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post('/register', { username, email, password });
      setMessage('Registration successful! Redirecting to login...');
      navigate('/', { state: { message: 'Account creation successful, now login!' } });
    } catch (error) {
      setMessage('Registration failed. Please try again.');
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
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Register</button>
      {message && <p className="error-message">{message}</p>}
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
