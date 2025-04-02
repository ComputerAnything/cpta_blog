import React, { useState } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';


// This component handles user login
const Login = () => {
  // State variables to hold username and password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Function to handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      const response = await API.post('/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      alert('Login successful!');
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
