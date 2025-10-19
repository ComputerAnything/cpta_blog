import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import styled from 'styled-components'

const StyledFooter = styled.footer`
  background: #0a0a0a !important;
  color: #ffffff;
  padding: 3rem 0 1.5rem 0;
  border-top: 1px solid rgba(0, 255, 65, 0.15);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff41, transparent);
  }

  .footer-logo {
    max-height: 40px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0, 255, 65, 0.3);
    }
  }

  .footer-links {
    a {
      color: #ffffff80;
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        color: #00ff41;
        text-decoration: none;
      }
    }
  }

  .copyright-text {
    color: #ffffff60;
    font-size: 0.9rem;

    .company-attribution {
      transition: all 0.3s ease;
      position: relative;
      color: #ffffff90 !important;
      text-decoration: underline !important;
      text-decoration-color: #ffffff60;
      text-underline-offset: 3px;

      &:hover {
        color: #00ff41 !important;
        text-decoration-color: #00ff41 !important;

        .footer-logo {
          transform: scale(1.1);
          box-shadow: 0 4px 20px rgba(0, 255, 65, 0.4);
        }
      }
    }
  }
`

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #181818;
  border: 1px solid #333;
  border-radius: 50%;
  color: #ffffff80;
  text-decoration: none;
  transition: all 0.3s ease;
  margin: 0 0.5rem;

  &:hover {
    background: #00ff41;
    color: white;
    border-color: #00ff41;
    transform: translateY(-2px);
  }

  i {
    font-size: 1rem;
  }
`

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <StyledFooter>
      <Container>
        {/* Main Footer Content */}
        <Row className="mb-4">
          <Col md={6} lg={4} className="mb-4">
            <h5 className="text-white mb-3">Computer Anything Tech Blog</h5>
            <p className="text-white-50 mb-3">
              Insights, tutorials, and updates on web development, cybersecurity,
              and cutting-edge technology from the Computer Anything team.
            </p>
            <div className="d-flex">
              <SocialLink href="https://discord.gg/QXs6p75pcS" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-discord"></i>
              </SocialLink>
              <SocialLink href="https://www.facebook.com/people/ComputerAnything/61567372806344/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-facebook"></i>
              </SocialLink>
              <SocialLink href="https://blog.computeranything.dev" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-journal-text"></i>
              </SocialLink>
              <SocialLink href="https://github.com/ComputerAnything" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-github"></i>
              </SocialLink>
            </div>
          </Col>

          <Col md={6} lg={2} className="mb-4">
            <h6 className="text-white mb-3">Explore</h6>
            <div className="footer-links">
              <div className="mb-2">
                <a href="/posts">All Posts</a>
              </div>
              <div className="mb-2">
                <a href="/create-post">Write a Post</a>
              </div>
              <div className="mb-2">
                <a href="/profile">My Profile</a>
              </div>
            </div>
          </Col>

          <Col md={6} lg={2} className="mb-4">
            <h6 className="text-white mb-3">Company</h6>
            <div className="footer-links">
              <div className="mb-2">
                <a href="https://computeranything.dev" target="_blank" rel="noopener noreferrer">
                  Main Website
                </a>
              </div>
              <div className="mb-2">
                <a href="https://cheloniixd.github.io/" target="_blank" rel="noopener noreferrer">
                  About Developer
                </a>
              </div>
              <div className="mb-2">
                <a href="https://github.com/ComputerAnything" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
              <div className="mb-2">
                <a href="https://apilooter.computeranything.dev/" target="_blank" rel="noopener noreferrer">
                  API Looter
                </a>
              </div>
            </div>
          </Col>

          <Col md={6} lg={4} className="mb-4">
            <h6 className="text-white mb-3">Contact Info</h6>
            <div className="footer-links">
              <div className="mb-2">
                <i className="bi bi-envelope me-2" style={{ color: '#00ff41' }}></i>
                <a href="mailto:contact@computeranything.dev">contact@computeranything.dev</a>
              </div>
              <div className="mb-2">
                <i className="bi bi-telephone me-2" style={{ color: '#00ff41' }}></i>
                <a href="tel:+16313586777">(631) 358-6777</a>
              </div>
              <div className="mb-2">
                <i className="bi bi-globe me-2" style={{ color: '#00ff41' }}></i>
                <a href="https://www.computeranything.dev" target="_blank" rel="noopener noreferrer">
                  computeranything.dev
                </a>
              </div>
            </div>
          </Col>
        </Row>

        {/* Copyright Section */}
        <Row className="pt-3" style={{ borderTop: '1px solid #333' }}>
          <Col className="text-center">
            <div className="copyright-text">
              <div className="d-flex flex-wrap align-items-center justify-content-center gap-1">
                <span>Copyright © {currentYear} Computer Anything - All Rights Reserved</span>
                <span>- Developed & Designed By:</span>
                <a
                  href="https://computeranything.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center gap-1 company-attribution"
                  style={{ color: 'inherit' }}
                >
                  Computer Anything LLC
                  <img
                    src="/img/logo_small_nobg.png"
                    alt="Computer Anything LLC"
                    className="footer-logo"
                  />
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </StyledFooter>
  )
}

export default Footer
