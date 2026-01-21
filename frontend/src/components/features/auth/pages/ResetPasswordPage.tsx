import React, { useState } from 'react'
import { Container, Form, Card } from 'react-bootstrap'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { authAPI } from '../../../../services/api'
import logger from '../../../../utils/logger'
import { getErrorMessage } from '../../../../utils/errors'
import StyledAlert from '../../../common/StyledAlert'
import PasswordStrengthMeter from '../../../common/PasswordStrengthMeter'
import { SubmitButton } from '../../../common/StyledButton'
import { PasswordInput } from '../../../common/PasswordInput'
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

  .password-requirements {
    color: ${colors.text.muted};
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
`

const ResetPasswordPage: React.FC = () => {
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

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    setLoading(true)

    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } catch (error: unknown) {
      logger.error('Reset password error:', error)
      setError(getErrorMessage(error, 'An error occurred. The link may have expired. Please request a new password reset.'))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <PageWrapper>
        <Container>
          <StyledCard>
            <Card.Header>
              <h2><i className="bi bi-x-circle me-2"></i>Invalid Link</h2>
            </Card.Header>
            <Card.Body>
              <StyledAlert variant="danger">
                <strong>Invalid or Expired Link</strong>
                This password reset link is invalid or has expired.
                Please request a new password reset.
              </StyledAlert>
              <div className="text-center">
                <Link to="/forgot-password" className="back-link">
                  <i className="bi bi-arrow-left"></i>
                  Request New Reset Link
                </Link>
              </div>
            </Card.Body>
          </StyledCard>
        </Container>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Container>
        <StyledCard>
          <Card.Header>
            <h2><i className="bi bi-shield-lock me-2"></i>Reset Password</h2>
            <div className="subtitle">Enter your new password</div>
          </Card.Header>
          <Card.Body>
            {error && (
              <StyledAlert variant="danger" className="mb-3">
                <strong>Password Reset Failed</strong>
                {error}
              </StyledAlert>
            )}

            {success ? (
              <StyledAlert variant="success">
                <strong><i className="bi bi-check-circle me-2"></i>Password Reset!</strong>
                <p className="mb-2">
                  Your password has been successfully reset. You can now log in with your new password.
                  Redirecting you to the home page...
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
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    label="New Password"
                    placeholder="Enter new password"
                    required
                    autoComplete="new-password"
                  />
                  <PasswordStrengthMeter password={password} />
                </Form.Group>

                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                />

                <div className="d-grid mb-3">
                  <SubmitButton
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Reset Password
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

export default ResetPasswordPage
