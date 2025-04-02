import React, { useState } from 'react';
import API from '../services/api';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate


// This component handles user login
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/login', { username, password });
      localStorage.setItem('token', response.data.access_token); // Save the token in localStorage
      alert('Login successful!');
      navigate('/blogs', { state: { message: 'Welcome to the blog posts page!' } });
    } catch (error) {
      alert('Login failed!');
    }
  };

  // Render the login form
  return (
    <div>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;
