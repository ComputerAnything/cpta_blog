import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAppSelector, useAppDispatch } from '../../redux/hooks'
import { logout, setGuest } from '../../redux/slices/authSlice'

const StyledNavbar = styled.nav`
  background: rgba(0, 0, 0, 0.95) !important;
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(40, 167, 69, 0.2);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1030;
  transition: all 0.3s ease;

  &.navbar-scrolled {
    background: rgba(0, 0, 0, 0.98) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--computerAnythingPrimary), transparent);
  }

  .navbar-brand {
    font-weight: 700;
    font-size: 1.5rem;
    color: white !important;
    text-decoration: none;
    transition: all 0.3s ease;
    background: none;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;

    &:hover {
      color: var(--computerAnythingPrimary) !important;
      transform: scale(1.02);
    }
  }

  .brand-logo {
    height: 40px;
    width: auto;
    margin-right: 12px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);
    }
  }

  &.navbar-scrolled .brand-logo {
    height: 35px;
  }

  @media (max-width: 768px) {
    .brand-logo {
      height: 35px;
      margin-right: 10px;
    }
  }

  @media (max-width: 576px) {
    .brand-logo {
      height: 30px;
      margin-right: 8px;
    }
  }

  @media (max-width: 420px) {
    .brand-logo {
      height: 28px;
      margin-right: 6px;
    }
  }

  .navbar-nav {
    .nav-link {
      color: rgba(255, 255, 255, 0.8) !important;
      font-weight: 500;
      padding: 0.75rem 1rem !important;
      margin: 0 0.25rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      text-decoration: none;

      &:hover {
        color: var(--computerAnythingPrimary) !important;
        background: rgba(40, 167, 69, 0.1);
        transform: translateY(-1px);
      }
    }

    .nav-button {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8) !important;
      font-weight: 500;
      padding: 0.75rem 1rem !important;
      margin: 0 0.25rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
      text-decoration: underline;

      &:hover {
        color: var(--computerAnythingPrimary) !important;
        background: rgba(40, 167, 69, 0.1);
        transform: translateY(-1px);
      }
    }
  }

  .navbar-toggler {
    border: 2px solid rgba(40, 167, 69, 0.5);
    padding: 0.5rem;

    &:focus {
      box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
    }

    .navbar-toggler-icon {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='%2328a745' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
    }
  }

  .btn-outline-success,
  .btn-outline-warning,
  .btn-outline-light {
    background: linear-gradient(135deg, #28a745 0%, #18b183ff 100%);
    border: none;
    color: #fff !important;
    padding: 0.45rem 0.9rem;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 10px;
    box-shadow: 0 8px 20px rgba(40, 167, 69, 0.18);
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(40, 167, 69, 0.22);
      opacity: 0.98;
    }
  }

  .btn-outline-warning {
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    box-shadow: 0 8px 20px rgba(255, 193, 7, 0.18);

    &:hover {
      box-shadow: 0 12px 30px rgba(255, 193, 7, 0.22);
    }
  }

  @media (max-width: 991.98px) {
    .navbar-collapse {
      background: rgba(0, 0, 0, 0.98);
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid rgba(40, 167, 69, 0.2);
      backdrop-filter: blur(20px);
    }
  }
`

const Navbar: React.FC = () => {
  const { user, isGuest } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
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

  const handleBlogClick = () => {
    if (user && !isGuest) {
      closeNavbar()
      navigate('/posts')
    } else {
      dispatch(setGuest())
      localStorage.setItem('guest', 'true')
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('userId')
      closeNavbar()
      navigate('/posts')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    localStorage.clear()
    closeNavbar()
    navigate('/')
  }

  const handleExitGuest = () => {
    dispatch(logout())
    localStorage.clear()
    closeNavbar()
    navigate('/')
  }

  return (
    <StyledNavbar className={`navbar navbar-expand-lg navbar-dark sticky-top ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container-fluid px-4">
        <button
          className="navbar-brand btn btn-link"
          onClick={handleBlogClick}
        >
          <img
            src="/img/logo_small_nobg.png"
            alt="Computer Anything"
            className="brand-logo"
          />
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
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link" href="https://computeranything.dev/#contact">
                Contact Us
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://computeranything.dev/#reference-clients">
                Reference Clients
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://computeranything.dev/#testimonials">
                Testimonials
              </a>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto d-flex align-items-center">
            {user && !isGuest && (
              <>
                <li className="nav-item">
                  <span className="navbar-text text-white me-3">
                    Signed in as:{' '}
                    <button
                      className="nav-button"
                      onClick={() => {
                        closeNavbar()
                        navigate('/profile')
                      }}
                    >
                      {user.username}
                    </button>
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
                  <span className="navbar-text text-warning me-3">Guest Mode</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-warning btn-sm" onClick={handleExitGuest}>
                    Exit Guest
                  </button>
                </li>
              </>
            )}

            {!user && !isGuest && (
              <li className="nav-item">
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => {
                    dispatch(setGuest())
                    localStorage.setItem('guest', 'true')
                    localStorage.removeItem('token')
                    localStorage.removeItem('username')
                    localStorage.removeItem('userId')
                    closeNavbar()
                    navigate('/posts')
                  }}
                >
                  Continue as Guest
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </StyledNavbar>
  )
}

export default Navbar
