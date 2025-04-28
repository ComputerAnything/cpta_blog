import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/layout/LoadingScreen';
import Profile from './components/blog/Profile';
import BlogList from './components/blog/BlogList';
import PostDetail from './components/blog/PostDetail';
import CreatePost from './components/blog/CreatePost';
import EditPost from './components/blog/EditPost';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './components/LandingPage';
import Modal from './components/layout/Modal';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { closeModal } from './redux/authSlice';


const ModalManager = () => {
  const modal = useSelector((state) => state.auth.modal);
  const dispatch = useDispatch();

  if (!modal) return null;
  return (
    <Modal isOpen={!!modal} onClose={() => dispatch(closeModal())}>
      {modal === 'login' ? <Login /> : <Register />}
    </Modal>
  );
};

const App = () => (
  <Provider store={store}>
    <Router>
      <LoadingScreen />
      <Navbar />
      <ModalManager />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        {/* Protected Routes */}
        <Route path="/posts" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/edit-post/:postId" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        <Route path="/posts/:postId?" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        {/* Error Route */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
      <Footer />
    </Router>
  </Provider>
);

export default App;
