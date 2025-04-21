import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4">
      <div className="container-fluid">
        {/* Navbar brand */}
        <a className="navbar-brand" href="/#home">
          Computer Anything
        </a>

        {/* Navbar toggler for mobile */}
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

        {/* Navbar content */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left side: Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="/#features">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/#contact">Contact</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/posts">Blog</a>
            </li>
          </ul>

          {/* Right side: Signed in message and logout button */}
          {user && (
            <div className="d-flex align-items-center">
              <span className="navbar-text text-white me-3">
                Signed in as: <strong>{user.username}</strong>
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
