import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Login from './Login';
import Register from './Register';
import Modal from './Modal';


const Navbar = ({ user, onLogout, setLoading }) => {
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
    // Close the dropdown menu
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    // Close the dropdown menu
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleSignupClick = () => {
    setShowRegisterModal(true);
    // Close the dropdown menu
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleHomeClick = () => {
    if (window.location.pathname !== '/') {
      navigate('/'); // Navigate to the home page
    }
    setTimeout(() => {
      const homeSection = document.getElementById('home');
      if (homeSection) {
        homeSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100); // Delay to ensure the DOM is loaded
    // Close the dropdown menu
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleContactClick = () => {
    if (window.location.pathname !== '/') {
      navigate('/'); // Navigate to the home page
    }
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100); // Delay to ensure the DOM is loaded
    // Close the dropdown menu
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleFeaturesClick = () => {
    if (window.location.pathname !== '/') {
      navigate('/'); // Navigate to the home page
    }
    setTimeout(() => {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100); // Delay to ensure the DOM is loaded
    // Close the dropdown menu
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4">
        <div className="container-fluid">
          <button
            className="navbar-brand btn btn-link"
            onClick={handleHomeClick}
          >
            Computer Anything
          </button>
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
                <button
                  className="nav-link btn btn-link"
                  onClick={handleFeaturesClick}
                >
                  Features
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link btn btn-link"
                  onClick={handleContactClick}
                >
                  Contact
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="navbar-brand nav-link"
                  onClick={handleBlogClick}
                >
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
                  onClick={handleLoginClick}
                >
                  Login
                </button>
                <button
                  className="btn btn-outline-light"
                  onClick={handleSignupClick}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <Login
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
          setLoading={setLoading}
        />
      </Modal>

      <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
        <Register
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          setLoading={setLoading}
        />
      </Modal>
    </>
  );
};

export default Navbar;
