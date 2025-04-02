import React, { useState } from 'react';
import API from '../services/api';


// This component handles user registration
const Register = () => {
  // State variables to hold form data
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Function to handle form submission
  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      const response = await API.post('/register', { username, email, password });
      setMessage('Registration successful! You can now log in.');
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
