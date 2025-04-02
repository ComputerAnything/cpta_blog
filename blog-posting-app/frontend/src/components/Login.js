import React, { useState } from 'react';
import API from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';


// This component handles user login
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  // Function to handle form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post('/login', { username, password });
      localStorage.setItem('token', response.data.access_token); // Save the token in localStorage
      localStorage.setItem('username', username); // Save the username in localStorage
      navigate('/blog'); // Redirect to the posts page
    } catch (error) {
      setMessage('Login failed. Please check your credentials.');
    }
  };

  // Render the login form
  return (
    <div>
      <h1>Login</h1>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>} {/* Display success message */}
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
      {message && <p>{message}</p>}
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;
