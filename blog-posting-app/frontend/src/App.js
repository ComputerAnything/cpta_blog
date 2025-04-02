import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import BlogList from './components/BlogList';
import CreatePost from './components/CreatePost';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute


// Main App component that sets up the routing for the application
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/blog" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;
