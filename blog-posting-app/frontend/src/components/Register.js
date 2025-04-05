import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../styles/Auth.css'; // Import the shared CSS file


// This component handles user registration
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Function to handle form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/register', { username, email, password });
      setMessage('Registration successful! Redirecting to login...');
      navigate('/', { state: { message: 'Account creation successful, now login!' } });
    } catch (error) {
      console.error('Error during registration:', error.response?.data || error.message);
      setMessage('Registration failed. Please try again.');
    }
  };

  // Render the registration form
  return (
    <div className="auth-container">
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
        <p>
          Already a member? <a href="/">Login</a>
        </p>
        {message && <p>{message}</p>}
      </form>
    </div>
  );
};

export default Register;
