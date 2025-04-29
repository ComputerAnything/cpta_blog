import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { openModal, logout, setGuest } from '../../redux/slices/authSlice';

const Navbar = () => {
  const { user, isGuest, modal } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/');
    setTimeout(() => {
      const homeSection = document.getElementById('home');
      if (homeSection) {
        homeSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleFeaturesClick = () => {
    navigate('/');
    setTimeout(() => {
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleContactClick = () => {
    navigate('/');
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleBlogClick = () => {
    if (!user || isGuest) {
      closeNavbar();
      navigate('/');
      dispatch(openModal('login'));
    } else {
      navigate('/posts');
      closeNavbar();
    }
  };

  // Helper to close navbar collapse
  const closeNavbar = () => {
    const navbarToggler = document.querySelector('.navbar-collapse');
    if (navbarToggler) {
      navbarToggler.classList.remove('show');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    // Close navbar before navigating to home
    closeNavbar();
    navigate('/');
  };


  // Exit guest mode handler
  const handleExitGuest = () => {
    dispatch(logout());
    localStorage.clear();
    // Close navbar before opening the register modal
    closeNavbar();
    dispatch(openModal('register'));
  };


  return (
    <nav className={`navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4${modal ? ' navbar-disabled' : ''}`}>
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
          <div className="d-flex align-items-center">
          {user && !isGuest ? (
            <>
              <span className="navbar-text text-white me-3">
                Signed in as:{' '}
                <strong>
                <button
                  className="btn btn-link p-0 m-0 align-baseline"
                  style={{ color: '#fff', textDecoration: 'underline', fontWeight: 'bold' }}
                  onClick={() => {
                    closeNavbar();
                    navigate('profile');
                  }}
                >
                  {user.username}
                </button>
                </strong>
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : isGuest ? (
              <>
                <span className="navbar-text text-warning me-3">
                  Guest Mode
                </span>
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={handleExitGuest}
                  style={{ marginRight: '0.5em' }}
                >
                  Exit Guest
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline-light me-2"
                  onClick={() => {
                    closeNavbar();
                    dispatch(openModal('login'));
                  }}
                >
                  Login
                </button>
                <button
                  className="btn btn-outline-light"
                  onClick={() => {
                    closeNavbar();
                    dispatch(openModal('register'));
                  }}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
