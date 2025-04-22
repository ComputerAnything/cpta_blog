import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Login from './Login';
import Register from './Register';
import Modal from './Modal';

const Navbar = ({ user, onLogout }) => {
  const [isValidToken, setIsValidToken] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsValidToken(false);
        return;
      }

      try {
        await API.get('/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsValidToken(true);
      } catch (error) {
        console.error('Invalid or expired token:', error.response?.data || error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsValidToken(false);
        navigate('/');
      }
    };

    validateToken();
  }, [navigate]);

  const handleBlogClick = () => {
    if (isValidToken) {
      navigate('/posts');
    } else {
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4">
        <div className="container-fluid">
          <a className="navbar-brand" href="/#home">
            Computer Anything
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" href="/#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/#contact">Contact</a>
              </li>
              <li className="nav-item">
                <button className="navbar-brand nav-link" onClick={handleBlogClick}>
                  Blog
                </button>
              </li>
            </ul>
            {isValidToken && user?.username ? (
              <div className="d-flex align-items-center">
                <span className="navbar-text text-white me-3">
                  Signed in as: <strong>{user.username}</strong>
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-flex">
                <button
                  className="btn btn-outline-light me-2"
                  onClick={() => setShowLoginModal(true)}
                >
                  Login
                </button>
                <button
                  className="btn btn-outline-light"
                  onClick={() => setShowRegisterModal(true)}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <Login onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }} />
      </Modal>

      {/* Register Modal */}
      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
        <Register onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }} />
      </Modal>
    </>
  );
};

export default Navbar;
