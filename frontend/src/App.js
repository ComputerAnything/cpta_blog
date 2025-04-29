import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Profile from './components/Profile';
import BlogList from './components/BlogList';
import PostDetail from './components/PostDetail';
import CreatePost from './components/CreatePost';
import EditPost from './components/EditPost';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import VerifyEmail from './components/VerifyEmail';


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        {/* Email Verification */}
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        {/* Protected Routes */}
        <Route path="/posts" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/edit-post/:postId" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        <Route path="/posts/:postId?" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        {/* Fallback route */}
        <Route path="*" element={<h1>404 Not Found, It's probably your fault though TBH, LOL.</h1>} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
