import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Container, Form, Card } from 'react-bootstrap'
import styled from 'styled-components'
import { authAPI } from '../../../../services/api'
import { colors, gradients, shadows } from '../../../../theme/colors'
import logger from '../../../../utils/logger'
import { getErrorMessage } from '../../../../utils/errors'
import StyledAlert from '../../../common/StyledAlert'
import PasswordStrengthMeter from '../../../common/PasswordStrengthMeter'
import { PasswordInput } from '../../../common/PasswordInput'
import { PrimaryButton } from '../../../common/StyledButton'
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

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate token exists
    if (!token) {
      setError('Invalid or missing reset token')
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/?login=true')
      }, 2000)
    } catch (error: unknown) {
      logger.error('Reset password error:', error)
      setError(getErrorMessage(error, 'Failed to reset password. The link may have expired.'))
    } finally {
      setLoading(false)
    }
  }

  // Show error if no token
  if (!token) {
    return (
      <>
        <PageWrapper>
          <ContentWrapper>
            <Container>
              <StyledCard>
                <Card.Header>
                  <h2><i className="bi bi-x-circle me-2"></i>Invalid Link</h2>
                </Card.Header>
                <Card.Body>
                  <StyledAlert variant="danger">
                    <strong>Invalid Reset Link</strong>
                    <div>This password reset link is invalid or has expired. Please request a new one.</div>
                  </StyledAlert>
                  <div className="text-center mt-3">
                    <Link to="/forgot-password" className="back-link">
                      <i className="bi bi-arrow-left"></i>
                      Request New Reset Link
                    </Link>
                  </div>
                </Card.Body>
              </StyledCard>
            </Container>
          </ContentWrapper>
        </PageWrapper>
        <Footer />
      </>
    )
  }

  return (
    <>
      <PageWrapper>
        <ContentWrapper>
          <Container>
            <StyledCard>
              <Card.Header>
                <h2><i className="bi bi-key me-2"></i>Reset Password</h2>
                <div className="subtitle">Choose a new secure password</div>
              </Card.Header>
              <Card.Body>
                {error && (
                  <StyledAlert variant="danger" className="mb-3">
                    <strong>Reset Failed</strong>
                    <div>{error}</div>
                  </StyledAlert>
                )}

                {success ? (
                  <StyledAlert variant="success">
                    <strong><i className="bi bi-check-circle me-2"></i>Success!</strong>
                    <p className="mb-2" style={{ marginTop: '0.5rem' }}>
                      Your password has been reset successfully! Redirecting to login...
                    </p>
                    <div className="text-center mt-3">
                      <Link to="/?login=true" className="back-link">
                        <i className="bi bi-box-arrow-in-right"></i>
                        Go to Login
                      </Link>
                    </div>
                  </StyledAlert>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        label="New Password"
                        placeholder="Enter your new password"
                        required
                        autoComplete="new-password"
                      />
                      <PasswordStrengthMeter password={password} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        label="Confirm New Password"
                        placeholder="Confirm your new password"
                        required
                        autoComplete="new-password"
                      />
                    </Form.Group>

                    <div className="d-grid mb-3">
                      <PrimaryButton
                        type="submit"
                        disabled={loading || !password || !confirmPassword}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Resetting Password...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-shield-check me-2"></i>
                            Reset Password
                          </>
                        )}
                      </PrimaryButton>
                    </div>

                    <div className="text-center">
                      <Link to="/?login=true" className="back-link">
                        <i className="bi bi-arrow-left"></i>
                        Back to Login
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

export default ResetPasswordPage
