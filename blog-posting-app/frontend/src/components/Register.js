import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


// This component handles user registration
const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to handle form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/register', { username, email, password });
      setMessage('Registration successful! Redirecting...');
      navigate('/blogs', { state: { message: 'Welcome to the blog posts page!' } });
    } catch (error) {
      setMessage('Registration failed. Please try again.');
    }
  };

  // Render the registration form
  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
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
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Register;
