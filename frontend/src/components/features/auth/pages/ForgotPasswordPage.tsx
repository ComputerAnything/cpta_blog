import { useState } from 'react'
import { Container, Form, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { authAPI } from '../../../../services/api'
import { useTurnstile } from '../../../../hooks/useTurnstile'
import StyledAlert from '../../../common/StyledAlert'
import logger from '../../../../utils/logger'
import { PrimaryButton } from '../../../common/StyledButton'
import { colors, gradients, shadows } from '../../../../theme/colors'
import Footer from '../../../layout/Footer'

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.backgroundDark} 0%, ${colors.background} 100%);
  display: flex;
  flex-direction: column;
  padding-top: 70px; /* Account for navbar */
`

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 40px 0;
`

const StyledCard = styled(Card)`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  box-shadow: ${shadows.large};
  max-width: 500px;
  margin: 0 auto;
  border-radius: 12px;

  .card-header {
    background: ${gradients.primary};
    border-bottom: none;
    color: ${colors.text.primary};
    padding: 1.5rem;
    text-align: center;
    border-radius: 12px 12px 0 0;

    h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #000;
    }

    .subtitle {
      margin-top: 0.5rem;
      font-size: 0.95rem;
      opacity: 0.9;
      color: #000;
    }
  }

  .card-body {
    padding: 2rem;
  }

  .form-label {
    color: ${colors.text.primary};
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .form-control {
    background: ${colors.backgroundDark};
    border: 1px solid ${colors.borderLight};
    color: ${colors.text.primary};
    padding: 0.75rem;
    border-radius: 8px;

    &:focus {
      background: ${colors.backgroundDark};
      border-color: ${colors.primary};
      box-shadow: 0 0 0 0.2rem rgba(2, 196, 60, 0.25);
      color: ${colors.text.primary};
    }

    &::placeholder {
      color: ${colors.text.muted};
    }
  }

  .form-text {
    color: ${colors.text.muted};
    display: block;
    margin-top: 0.5rem;
    font-size: 0.875rem;
  }

  .back-link {
    color: ${colors.primary};
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      color: ${colors.primaryDark};
      text-decoration: underline;
    }
  }
`

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Turnstile hook (always visible on this page)
  const { turnstileRef, getToken, reset: resetTurnstile } = useTurnstile(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate Turnstile
    const turnstileToken = getToken()

    if (!turnstileToken) {
      setError('Please complete the security verification.')
      return
    }

    setLoading(true)

    try {
      await authAPI.forgotPassword(email, firstName, lastName, turnstileToken)
      setSuccess(true)
      setEmail('')
      setFirstName('')
      setLastName('')
    } catch (error: unknown) {
      logger.error('Forgot password error:', error)

      // Extract error message
      let errorMessage = 'An error occurred. Please try again.'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        errorMessage = axiosError.response?.data?.error || errorMessage
      }
      setError(errorMessage)

      // Reset Turnstile on error
      resetTurnstile()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageWrapper>
        <ContentWrapper>
          <Container>
            <StyledCard>
              <Card.Header>
                <h2><i className="bi bi-key me-2"></i>Forgot Password</h2>
                <div className="subtitle">We'll send you a reset link</div>
              </Card.Header>
              <Card.Body>
                {error && (
                  <StyledAlert variant="danger" className="mb-3">
                    <strong>Unable to Process Request</strong>
                    <div>{error}</div>
                  </StyledAlert>
                )}

                {success ? (
                  <StyledAlert variant="success">
                    <strong><i className="bi bi-check-circle me-2"></i>Email Sent!</strong>
                    <p className="mb-2" style={{ marginTop: '0.5rem' }}>
                      If an account with that email exists, a password reset link has been sent.
                      Please check your email and follow the instructions. The link will expire in 2 hours.
                    </p>
                    <div className="text-center mt-3">
                      <Link to="/" className="back-link">
                        <i className="bi bi-arrow-left"></i>
                        Back to Home
                      </Link>
                    </div>
                  </StyledAlert>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        required
                      />
                      <Form.Text>
                        For security, please enter your full name as registered
                      </Form.Text>
                    </Form.Group>

                    {/* Turnstile CAPTCHA */}
                    <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '78px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div ref={turnstileRef}></div>
                    </div>

                    <div className="d-grid mb-3">
                      <PrimaryButton
                        type="submit"
                        disabled={loading || !email || !firstName || !lastName}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-envelope me-2"></i>
                            Send Reset Link
                          </>
                        )}
                      </PrimaryButton>
                    </div>

                    <div className="text-center">
                      <Link to="/" className="back-link">
                        <i className="bi bi-arrow-left"></i>
                        Back to Home
                      </Link>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </StyledCard>
          </Container>
        </ContentWrapper>
      </PageWrapper>
      <Footer />
    </>
  )
}

export default ForgotPasswordPage
