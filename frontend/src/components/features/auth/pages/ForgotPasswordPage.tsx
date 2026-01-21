import React, { useState } from 'react'
import { Container, Form, Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { authAPI } from '../../../../services/api'
import { useTurnstile } from '../../../../hooks/useTurnstile'
import StyledAlert from '../../../common/StyledAlert'
import logger from '../../../../utils/logger'
import { getErrorMessage } from '../../../../utils/errors'
import { SubmitButton } from '../../../common/StyledButton'
import { colors, gradients } from '../../../../theme/colors'

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${colors.backgroundDark} 0%, ${colors.background} 100%);
  display: flex;
  align-items: center;
  padding: 40px 0;
`

const StyledCard = styled(Card)`
  background: ${colors.background};
  border: 1px solid ${colors.primary};
  box-shadow: 0 8px 32px rgba(40, 167, 69, 0.15);
  max-width: 500px;
  margin: 0 auto;

  .card-header {
    background: ${gradients.primary};
    border-bottom: none;
    color: ${colors.text.primary};
    padding: 1.5rem;
    text-align: center;

    h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .subtitle {
      margin-top: 0.5rem;
      font-size: 0.95rem;
      opacity: 0.9;
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
    background: ${colors.backgroundLight};
    border: 1px solid ${colors.borderInput};
    color: ${colors.text.primary};
    padding: 0.75rem;
    border-radius: 8px;

    &:focus {
      background: ${colors.backgroundLight};
      border-color: ${colors.primary};
      box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
      color: ${colors.text.primary};
    }

    &::placeholder {
      color: ${colors.text.muted};
    }
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

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Turnstile hook (always visible on this page)
  const { turnstileRef, getToken, reset: resetTurnstile } = useTurnstile(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Trim and validate email
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    // Validate Turnstile
    const turnstileToken = getToken()

    if (!turnstileToken) {
      setError('Please complete the security verification.')
      return
    }

    setLoading(true)

    try {
      await authAPI.forgotPassword(trimmedEmail, turnstileToken)
      setSuccess(true)
      setEmail('')
    } catch (error: unknown) {
      logger.error('Forgot password error:', error)
      setError(getErrorMessage(error, 'An error occurred. Please try again.'))

      // Reset Turnstile on error
      resetTurnstile()
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
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
                {error}
              </StyledAlert>
            )}

            {success ? (
              <StyledAlert variant="success">
                <strong><i className="bi bi-check-circle me-2"></i>Email Sent!</strong>
                <p className="mb-2">
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
                    maxLength={120}
                    required
                  />
                </Form.Group>

                {/* Turnstile CAPTCHA */}
                <div style={{ textAlign: 'center', marginBottom: '1rem', minHeight: '78px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div ref={turnstileRef}></div>
                </div>

                <div className="d-grid mb-3">
                  <SubmitButton
                    type="submit"
                    disabled={loading || !email}
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
                  </SubmitButton>
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
    </PageWrapper>
  )
}

export default ForgotPasswordPage
