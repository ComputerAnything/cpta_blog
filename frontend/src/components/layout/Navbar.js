import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, setGuest } from '../../redux/slices/authSlice';

const Navbar = () => {
  const { user, isGuest } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();



  const handleBlogClick = () => {
    if (user && !isGuest) {
      closeNavbar();
      navigate('/posts');
    } else {
      // Set guest mode and go to /posts
      dispatch(setGuest());
      localStorage.setItem('guest', 'true');
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      closeNavbar();
      navigate('/posts');
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
    closeNavbar();
    navigate('/'); // Go to landing/auth page
  };


  return (
  <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4">
      <div className="container-fluid">
        <button
          className="navbar-brand btn btn-link"
          onClick={handleBlogClick}
          style={{ border: 'none', background: 'none', padding: 0, fontSize: '1.25rem' }}
        >
          Blog
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
          <ul className="navbar-nav mb-2 mb-lg-0 d-flex align-items-center me-auto">
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://computeranything.dev/#contact"
              >
                Contact Us
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://computeranything.dev/#reference-clients"
              >
                Reference Clients
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href="https://computeranything.dev/#testimonials"
              >
                Testimonials
              </a>
            </li>
          </ul>
          <ul className="navbar-nav mb-2 mb-lg-0 d-flex align-items-center ms-auto">
            {user && !isGuest && (
              <>
                <li className="nav-item">
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
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            )}
            {isGuest && (
              <>
                <li className="nav-item">
                  <span className="navbar-text text-warning me-3">
                    Guest Mode
                  </span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={handleExitGuest}
                  >
                    Exit Guest
                  </button>
                </li>
              </>
            )}
            {(!user && !isGuest) && (
              <li className="nav-item">
                <button
                  className="btn btn-outline-success btn-sm ms-2"
                  onClick={() => {
                    dispatch(setGuest());
                    localStorage.setItem('guest', 'true');
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    localStorage.removeItem('userId');
                    closeNavbar();
                    navigate('/posts');
                  }}
                >
                  Continue as Guest
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
