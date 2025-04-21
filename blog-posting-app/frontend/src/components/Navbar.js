import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top px-4">
      <div className="container-fluid">

        {/* Navbar links */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"> {/* Changed ms-auto to me-auto */}
            <li className="nav-item">
              <a className="nav-link navbar-brand" href="/#home">Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link navbar-brand" href="/#features">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link navbar-brand" href="/#contact">Contact</a>
            </li>
            <li className="nav-item">
              <a className="nav-link navbar-brand" href="/posts">Blog</a>
            </li>
          </ul>
        </div>

        {/* Right side: Signed in message and logout button */}
        {user && user.username && (
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
    </nav>
  );
};

export default Navbar;
