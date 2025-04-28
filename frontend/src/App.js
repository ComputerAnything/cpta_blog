import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import Profile from './components/Profile';
import BlogList from './components/BlogList';
import PostDetail from './components/PostDetail';
import CreatePost from './components/CreatePost';
import EditPost from './components/EditPost';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './components/LandingPage';
import VerifyEmail from './components/VerifyEmail';
import Modal from './components/Modal';
import Login from './components/Login';
import Register from './components/Register';
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/posts" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/edit-post/:postId" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        <Route path="/posts/:postId?" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
      <Footer />
    </Router>
  </Provider>
);

export default App;
