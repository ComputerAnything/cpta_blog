import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Dropdown } from 'react-bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import { colors, shadows, effects, gradients } from '../../theme/colors'

const StyledNavbar = styled.nav`
  background: ${colors.backgroundDark} !important;
  box-shadow: ${shadows.navbar};
  position: sticky;
  top: 0;
  z-index: 1030;
  transition: all 0.3s ease;
  height: 70px;
  display: flex;
  align-items: center;

  /* Enhanced sticky behavior */
  &.navbar-scrolled {
    background: ${colors.backgroundDark} !important;
    box-shadow: ${shadows.navbarScrolled};
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${colors.primary}, transparent);
    box-shadow: 0 0 8px rgba(2, 196, 60, 0.4);
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    font-weight: 700;
    font-size: 1.5rem;
    color: white !important;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      color: ${colors.primary} !important;
      transform: scale(1.02);
    }

    .brand-logo {
      height: 40px;
      width: auto;
      margin-right: 12px;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 15px ${colors.border};
      }
    }

    .brand-text {
      background: ${gradients.text};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .navbar-nav {
    .nav-link {
      color: ${colors.text.secondary} !important;
      font-weight: 500;
      padding: 0.75rem 1rem !important;
      margin: 0 0.25rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      position: relative;

      &:hover {
        color: ${colors.primary} !important;
        background: ${colors.hover};
        transform: translateY(-1px);
      }

      &.active {
        color: ${colors.primary} !important;
        background: ${colors.hoverDark};
      }
    }

    .nav-button {
      background: none;
      border: none;
      color: ${colors.text.secondary} !important;
      font-weight: 500;
      padding: 0.75rem 1rem !important;
      margin: 0 0.25rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        color: ${colors.primary} !important;
        background: ${colors.hover};
        transform: translateY(-1px);
      }
    }
  }

  .user-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Make the user controls more prominent */
  .user-section .btn.btn-outline-success,
  .user-section .btn.btn-outline-success.dropdown-toggle {
    background: ${gradients.primary};
    border: none;
    color: ${colors.text.primary} !important;
    padding: 0.45rem 0.9rem;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.18);
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  }

  .user-section .btn.btn-outline-success:hover,
  .user-section .btn.btn-outline-success:focus-visible,
  .user-section .btn.btn-outline-success.dropdown-toggle:hover,
  .user-section .btn.btn-outline-success.dropdown-toggle:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(40, 167, 69, 0.22);
    opacity: 0.98;
  }

  /* Slightly reduce badge prominence to keep focus on button */
  .user-section .badge {
    opacity: 0.95;
    font-weight: 700;
  }

  .navbar-toggler {
    border: 2px solid rgba(40, 167, 69, 0.5);
    padding: 0.5rem;

    &:focus {
      box-shadow: ${shadows.focus};
    }

    .navbar-toggler-icon {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='%2328a745' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
    }
  }

  /* React Bootstrap Dropdown styling */
  .dropdown-menu {
    background: ${colors.backgroundDark} !important;
    border: 1px solid ${colors.borderLight} !important;
    box-shadow: ${shadows.medium} !important;
  }

  .dropdown-item {
    -webkit-tap-highlight-color: transparent;
    transition: background 0.12s ease, color 0.12s ease, box-shadow 0.12s ease;
    color: ${colors.text.secondary} !important;

    i {
      margin-right: 0.5rem;
      color: ${colors.primary};
    }
  }

  .dropdown-item:hover,
  .dropdown-item:focus,
  .dropdown-item:focus-visible {
    outline: none;
    background: ${colors.hover} !important;
    color: ${colors.primary} !important;
    box-shadow: 0 4px 14px rgba(40,167,69,0.06);
  }

  .dropdown-item:active {
    background: ${colors.hoverDark} !important;
    color: ${colors.primary} !important;
  }

  .dropdown-divider {
    border-color: ${colors.border} !important;
  }

  /* Medium screens */
  @media (max-width: 768px) {
    .navbar-brand {
      font-size: 1.25rem;

      .brand-logo {
        height: 35px;
        margin-right: 10px;
      }
    }
  }

  /* Small screens */
  @media (max-width: 576px) {
    .navbar-brand {
      font-size: 1.1rem;

      .brand-logo {
        height: 30px;
        margin-right: 8px;
      }
    }
  }

  /* Extra small screens */
  @media (max-width: 420px) {
    .navbar-brand {
      font-size: 1rem;

      .brand-logo {
        height: 28px;
        margin-right: 6px;
      }

      .brand-text {
        /* Optionally truncate or adjust text */
        overflow: hidden;
        white-space: nowrap;
      }
    }
  }

  @media (max-width: 991.98px) {
    .navbar-collapse {
      background: ${colors.backgroundDark};
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid ${colors.borderLight};
      backdrop-filter: ${effects.backdropBlurStrong};
    }

    /* In mobile stacked menu reduce dropdown spacing so items align with non-dropdown items */
    .dropdown-menu {
      margin-bottom: 1rem !important;
      position: static !important;
      transform: none !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3) !important;
    }

    /* Give the user controls some breathing room from nav items when collapsed */
    .user-section {
      margin-top: 0.6rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(40, 167, 69, 0.06);
      display: flex;
      gap: 0.5rem;
      justify-content: flex-start;
    }
  }
`

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeNavbar = () => {
    const navbarToggler = document.querySelector('.navbar-collapse')
    if (navbarToggler) {
      navbarToggler.classList.remove('show')
    }
  }

  const handleHomeClick = () => {
    closeNavbar()
    navigate('/')
  }

  const handleLogout = async () => {
    await logout()
    closeNavbar()
    // Force full page reload with logout success banner
    window.location.href = '/?banner=logout-success'
  }

  const handleLogin = () => {
    closeNavbar()
    navigate('/?login=true')
  }

  const handleRegister = () => {
    closeNavbar()
    navigate('/?register=true')
  }

  return (
    <StyledNavbar className={`navbar navbar-expand-lg navbar-dark sticky-top ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container-fluid px-4">
        <button
          className="navbar-brand btn btn-link"
          onClick={handleHomeClick}
        >
          <img
            src="/img/logo_small_nobg.png"
            alt="Computer Anything"
            className="brand-logo"
          />
          Tech Blog
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
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button
                className="nav-button"
                onClick={handleHomeClick}
              >
                <i className="bi bi-journal-text me-2"></i>
                Blog Posts
              </button>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://computeranything.dev" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-code-slash me-2"></i>
                Computer Anything
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://computeranything.dev/contact" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-envelope me-2"></i>
                Contact Us
              </a>
            </li>
          </ul>

          <div className="user-section">
            {isAuthenticated && user ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-success">
                  <i className="bi bi-person-circle me-2"></i>
                  @{user.username}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => {
                    closeNavbar()
                    navigate('/profile')
                  }}>
                    <i className="bi bi-person"></i>
                    My Profile
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => {
                    closeNavbar()
                    navigate('/create-post')
                  }}>
                    <i className="bi bi-plus-circle"></i>
                    Create Post
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-success"
                  onClick={handleLogin}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </button>
                <button
                  className="btn btn-outline-success"
                  onClick={handleRegister}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StyledNavbar>
  )
}

export default Navbar
