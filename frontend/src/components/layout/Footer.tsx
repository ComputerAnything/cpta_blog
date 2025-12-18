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
        color: ${colors.primary} !important;
        text-decoration-color: ${colors.primary} !important;

        .footer-logo {
          transform: scale(1.1);
          box-shadow: 0 4px 20px rgba(40, 167, 69, 0.4);
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

const Footer: React.FC = () => {

  return (
    <>
      <StyledFooter>
        <Container>
          {/* Main Footer Content */}
          <Row className="">
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

            <Col md={6} lg={2} className="mb-2">
              <h6 className="text-white mb-3">Services</h6>
              <div className="footer-links">
                <div className="mb-2">
                  <a href="https://computeranything.dev/custom-development">Custom Development</a>
                </div>
                <div className="mb-2">
                  <a href="https://computeranything.dev/web-hosting">Web Hosting</a>
                </div>
                <div className="mb-2">
                  <a href="https://computeranything.dev/security">Security Audit</a>
                </div>
              </div>
            </Col>

            <Col md={6} lg={2} className="mb-2">
              <h6 className="text-white mb-3">Company</h6>
              <div className="footer-links">
                <div className="mb-2">
                  <a href="https://computeranything.dev" target="_blank" rel="noopener noreferrer">
                    Main Website
                  </a>
                </div>
                <div className="mb-2">
                  <a href="https://blog.computeranything.dev/" target="_blank" rel="noopener noreferrer">
                    Tech Blog
                  </a>
                </div>
                <div className="mb-2">
                  <a href="https://apilooter.computeranything.dev/" target="_blank" rel="noopener noreferrer">
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
                  <span>Enterprise Security</span>
                </div>
                <span className="d-none d-sm-inline">•</span>
                <div className="d-flex align-items-center">
                  <i className="bi bi-award text-success me-2 d-sm-none"></i>
                  <span>OWASP Top 10 Compliant</span>
                </div>
                <span className="d-none d-sm-inline">•</span>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clipboard-check text-success me-2 d-sm-none"></i>
                  <span>Secure Authentication</span>
                </div>
              </div>
            </Col>
          </Row>

          {/* Copyright Section */}
          <Row className="pt-3">
            <Col className="text-center">
              <div className="copyright-text">
                <div className="d-flex flex-wrap align-items-center justify-content-center gap-1">
                  <span>Copyright © 2025 Computer Anything - All Rights Reserved</span>
                  <span>- Developed &amp; Designed By:</span>
                  <a
                    href="https://www.computeranything.dev"
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
    </>
  )
}

export default Footer
