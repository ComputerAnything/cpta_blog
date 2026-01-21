import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import styled from 'styled-components'
import { colors } from '../../theme/colors'

const StyledFooter = styled.footer`
  background: ${colors.backgroundBlack} !important;
  color: ${colors.text.primary};
  padding: 3rem 0 1.5rem 0;
  border-top: 1px solid rgba(2, 196, 60, 0.15);
  position: relative;

  .footer-logo {
    max-height: 40px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(2, 196, 60, 0.3);
    }
  }

  .footer-links {
    a {
      color: ${colors.text.secondary};
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        color: ${colors.primary};
        text-decoration: none;
      }
    }
  }

  .footer-nav-button {
    color: ${colors.text.secondary} !important;
    text-decoration: none !important;
    border: none !important;
    background: none !important;
    transition: all 0.3s ease;

    &:hover {
      color: ${colors.primary} !important;
      text-decoration: none !important;
      background: none !important;
    }

    &:focus {
      box-shadow: none !important;
      color: ${colors.primary} !important;
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
  border: 1px solid ${colors.borderDark};
  border-radius: 50%;
  color: ${colors.text.secondary};
  text-decoration: none;
  transition: all 0.3s ease;
  margin: 0 0.5rem;

  &:hover {
    background: ${colors.primary};
    color: white;
    border-color: ${colors.primary};
    transform: translateY(-2px);
  }

  i {
    font-size: 1rem;
  }
`

const CopyrightContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`

const CopyrightText = styled.span`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.3px;

  @media (max-width: 576px) {
    font-size: 0.8rem;
  }
`

const Separator = styled.span`
  color: ${colors.primary};
  font-weight: bold;
  text-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
`

const PoweredBy = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  min-width: 0;

  a {
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    position: relative;
    font-size: 0.875rem;

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, ${colors.primary}, ${colors.primaryDark});
      transition: width 0.3s ease;
    }

    &:hover {
      color: ${colors.primary};
      text-shadow: 0 0 8px rgba(40, 167, 69, 0.5);

      &::after {
        width: 100%;
      }
    }
  }

  @media (max-width: 576px) {
    gap: 0.45rem;

    a {
      font-size: 0.85rem;
    }
  }

  @media (max-width: 320px) {
    flex-direction: column;
    gap: 0.5rem;
    white-space: normal;
  }
`

const FooterLogo = styled.img`
  width: 45px;
  height: 45px;
  border-radius: 5px;
  box-shadow: 0 0 15px rgba(40, 167, 69, 0.3);
  vertical-align: middle;
  display: inline-block;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1) translateY(-2px);
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.6),
      0 0 25px rgba(40, 167, 69, 0.6),
      0 0 40px rgba(24, 177, 131, 0.4);
    border-color: ${colors.primary};
  }
`

interface FooterProps {
  clientName?: string
  clientYear?: number
  logoSrc?: string
}

const Footer: React.FC<FooterProps> = ({
  clientName = 'Computer Anything LLC',
  clientYear = new Date().getFullYear(),
  logoSrc = '/img/cpt-anything-transparent-thumb.png',
}) => {

  return (
    <StyledFooter>
      <Container>
        {/* Main Footer Content */}
        <Row className="">
          <Col md={6} lg={4} className="mb-4">
            <h5 className="text-white mb-3">Computer Anything Tech Blog</h5>
            <p className="text-white-50 mb-3">
              Insights, tutorials, and updates on web development, cybersecurity, and cutting-edge technology from the
              Computer Anything team.
            </p>
            <div className="d-flex">
              <SocialLink href="https://discord.gg/QXs6p75pcS" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-discord"></i>
              </SocialLink>
              <SocialLink href="https://www.facebook.com/people/Computer-Anything/61567372806344/" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-facebook"></i>
              </SocialLink>
              <SocialLink href="https://github.com/ComputerAnything" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-github"></i>
              </SocialLink>
              <SocialLink href="https://blog.computeranything.dev" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-journal-text"></i>
              </SocialLink>
            </div>
          </Col>

          <Col md={6} lg={2} className="mb-2">
            <h6 className="text-white mb-3">Services</h6>
            <div className="footer-links">
              <div className="mb-2">
                <a
                  className="btn btn-link p-0 text-start footer-nav-button"
                  href="https://computeranything.dev/services/custom-development"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Custom Development
                </a>
              </div>
              <div className="mb-2">
                <a
                  className="btn btn-link p-0 text-start footer-nav-button"
                  href="https://computeranything.dev/services/web-hosting"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Web Hosting
                </a>
              </div>
              <div className="mb-2">
                <a
                  className="btn btn-link p-0 text-start footer-nav-button"
                  href="https://computeranything.dev/services/security-audit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Security Audit
                </a>
              </div>
            </div>
          </Col>

          <Col md={6} lg={2} className="mb-2
          ">
            <h6 className="text-white mb-3">Company</h6>
            <div className="footer-links">
              <div className="mb-2">
                <a
                  href="https://computeranything.dev/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-link p-0 text-start footer-nav-button"
                >
                  FAQ
                </a>
              </div>
              <div className="mb-2">
                <a
                  href="https://blog.computeranything.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-link p-0 text-start footer-nav-button"
                >
                  Tech Blog
                </a>
              </div>
              <div className="mb-2">
                <a
                  href="https://apilooter.computeranything.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-link p-0 text-start footer-nav-button"
                >
                  API Looter
                </a>
              </div>
            </div>
          </Col>

          <Col md={6} lg={4} className="mb-2">
            <h6 className="text-white mb-3">Company Contact Info</h6>
            <div className="footer-links">
              <div className="mb-2">
                <i className="bi bi-envelope me-2 text-success"></i>
                <a href="mailto:contact@computeranything.dev">contact@computeranything.dev</a>
              </div>
              <div className="mb-2">
                <i className="bi bi-telephone me-2 text-success"></i>
                <a href="tel:+16313586777">(631) 358-6777</a>
              </div>
              <div className="mb-2">
                <i className="bi bi-globe me-2 text-success"></i>
                <a href="https://www.computeranything.dev" target="_blank" rel="noopener noreferrer">computeranything.dev</a>
              </div>
            </div>
          </Col>
        </Row>

        {/* Security Trust Badge Row */}
        <Row className="py-3" style={{ borderTop: `1px solid ${colors.borderDark}`, borderBottom: `1px solid ${colors.borderDark}` }}>
          <Col className="text-center">
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 text-white-50 small">
              <div className="d-flex align-items-center">
                <i className="bi bi-shield-check text-success me-2"></i>
                <span>OWASP Top 10</span>
              </div>
              <span className="d-none d-sm-inline">•</span>
              <div className="d-flex align-items-center">
                <i className="bi bi-layers text-success me-2"></i>
                <span>5-Layer Security</span>
              </div>
              <span className="d-none d-sm-inline">•</span>
              <div className="d-flex align-items-center">
                <i className="bi bi-clipboard-check text-success me-2"></i>
                <span>Secure Authentication</span>
              </div>
            </div>
          </Col>
        </Row>

          {/* Copyright Section */}
          <Row className="pt-3">
            <Col className="text-center">
              <CopyrightContent className="d-flex flex-wrap flex-row align-items-center justify-content-center gap-2">
                <CopyrightText className="text-center">
                  Copyright © {clientYear} {clientName} - All Rights Reserved
                </CopyrightText>
                {/* Separator is hidden on small screens for responsive design */}
                <Separator className="mx-1 d-none d-sm-inline">&middot;</Separator>
                <PoweredBy>
                  <a
                    href="https://computeranything.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Powered by Computer Anything LLC
                  </a>
                  <a
                    href="https://computeranything.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FooterLogo
                      src={logoSrc}
                      alt="Computer Anything Logo"
                      height={40}
                    />
                  </a>
                </PoweredBy>
              </CopyrightContent>
            </Col>
          </Row>

      </Container>
    </StyledFooter>
  )
}

export default Footer
