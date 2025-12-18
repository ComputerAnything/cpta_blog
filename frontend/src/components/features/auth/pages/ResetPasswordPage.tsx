import { useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Form, Button } from 'react-bootstrap'
import styled from 'styled-components'
import { authAPI } from '../../../../services/api'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { PageContainer as BasePageContainer } from '../../../../theme/sharedComponents'
import Footer from '../../../layout/Footer'

const PageContainer = styled(BasePageContainer)`
  display: flex;
  align-items: center;
  padding: 2rem 0;
`

const ResetCard = styled.div`
  background: ${colors.backgroundAlt};
  backdrop-filter: blur(10px);
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 2.5rem;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: ${shadows.large};
`

const Title = styled.h2`
  color: ${colors.primary};
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 700;
`

const Subtitle = styled.p`
  color: ${colors.text.secondary};
  text-align: center;
  margin-bottom: 2rem;
`

const StyledForm = styled(Form)`
  .form-label {
    color: ${colors.text.primary};
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .form-control {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid ${colors.borderLight};
    color: ${colors.text.primary};
    padding: 0.75rem;

    &:focus {
      background: rgba(0, 0, 0, 0.6);
      border-color: ${colors.primary};
      box-shadow: ${shadows.focus};
      color: ${colors.text.primary};
    }

    &::placeholder {
      color: ${colors.text.muted};
    }
  }

  .input-group {
    position: relative;

    .toggle-password-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      z-index: 10;
      padding: 0.25rem 0.5rem;
      color: ${colors.text.secondary};
      transition: ${transitions.default};

      &:hover {
        color: ${colors.primary};
      }
    }

    input {
      padding-right: 50px;
    }
  }
`

const AuthButton = styled(Button)`
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
  border: none;
  color: #000;
  font-weight: 600;
  padding: 0.75rem;
  transition: ${transitions.fast};
  width: 100%;
  box-shadow: ${shadows.button};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${shadows.buttonHover};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid ${colors.danger};
  color: ${colors.danger};
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SuccessMessage = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid ${colors.success};
  color: ${colors.success};
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const PasswordStrengthMeter = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`

const StrengthBar = styled.div<{ strength: number }>`
  height: 4px;
  background: ${props => {
    if (props.strength === 0) return 'rgba(255, 255, 255, 0.1)';
    if (props.strength === 1) return colors.danger;
    if (props.strength === 2) return '#ffa500';
    if (props.strength === 3) return colors.success;
    if (props.strength === 4) return colors.success;
    return 'rgba(255, 255, 255, 0.1)';
  }};
  width: ${props => (props.strength / 4) * 100}%;
  transition: ${transitions.default};
  border-radius: 2px;
`

const StrengthBarContainer = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`

const StrengthText = styled.div<{ strength: number }>`
  font-size: 0.875rem;
  margin-top: 0.25rem;
  color: ${props => {
    if (props.strength === 0) return colors.text.muted;
    if (props.strength === 1) return colors.danger;
    if (props.strength === 2) return '#ffa500';
    if (props.strength === 3) return colors.success;
    if (props.strength === 4) return colors.success;
    return colors.text.muted;
  }};
`

const PasswordRequirements = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;

  li {
    color: ${colors.text.muted};
    margin-bottom: 0.25rem;

    &.met {
      color: ${colors.success};
    }

    &::before {
      content: '• ';
      margin-right: 0.25rem;
    }
  }
`

const BackToLogin = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  display: block;
  margin: 1.5rem auto 0;
  transition: ${transitions.default};

  &:hover {
    color: ${colors.primaryDark};
  }
`

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calculate password strength (matches cpta_app logic)
  const calculatePasswordStrength = (pwd: string) => {
    const requirements = {
      minLength8: pwd.length >= 8,
      minLength12: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }

    // If less than 8 chars, weak
    if (pwd.length < 8) {
      return { strength: 1, label: 'Weak', requirements, isValid: false }
    }

    // If 12+ characters, automatically strong
    if (requirements.minLength12) {
      return { strength: 4, label: 'Strong', requirements, isValid: true }
    }

    // Between 8-11 characters - check complexity
    const complexityCount = [
      requirements.uppercase,
      requirements.lowercase,
      requirements.number,
      requirements.special
    ].filter(Boolean).length

    if (complexityCount === 4) {
      return { strength: 3, label: 'Good', requirements, isValid: true }
    } else if (complexityCount >= 2) {
      return { strength: 2, label: 'Fair', requirements, isValid: false }
    } else {
      return { strength: 1, label: 'Weak', requirements, isValid: false }
    }
  }

  const { strength: passwordStrength, label, requirements, isValid } = calculatePasswordStrength(password)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSuccess(false)

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    // Validate password strength
    if (!isValid) {
      setMessage('Password does not meet security requirements')
      return
    }

    if (!token) {
      setMessage('Invalid reset token')
      return
    }

    setLoading(true)

    try {
      await authAPI.resetPassword(token, password)
      setMessage('Password has been reset successfully')
      setIsSuccess(true)
      setPassword('')
      setConfirmPassword('')

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/?login=true')
      }, 3000)
    } catch (error) {
      console.error('Password reset failed:', error)
      setMessage('Failed to reset password. The link may have expired.')
      setIsSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/?login=true')
  }

  return (
    <>
      <PageContainer>
        <Container>
          <ResetCard>
            <Title>Reset Your Password</Title>
            <Subtitle>Enter your new password below</Subtitle>

            <StyledForm onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSuccess}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
                {password && (
                  <PasswordStrengthMeter>
                    <StrengthBarContainer>
                      <StrengthBar strength={passwordStrength} />
                    </StrengthBarContainer>
                    <StrengthText strength={passwordStrength}>
                      Password Strength: {label}
                    </StrengthText>
                    {passwordStrength < 3 && (
                      <PasswordRequirements>
                        <li className={requirements.minLength12 ? 'met' : ''}>
                          12+ characters (recommended)
                        </li>
                        {!requirements.minLength12 && (
                          <>
                            <li className={requirements.minLength8 ? 'met' : ''}>At least 8 characters</li>
                            <li className={requirements.uppercase ? 'met' : ''}>One uppercase letter</li>
                            <li className={requirements.lowercase ? 'met' : ''}>One lowercase letter</li>
                            <li className={requirements.number ? 'met' : ''}>One number</li>
                            <li className={requirements.special ? 'met' : ''}>One special character (!@#$%^&*)</li>
                          </>
                        )}
                      </PasswordRequirements>
                    )}
                  </PasswordStrengthMeter>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSuccess}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </Form.Group>

              <AuthButton type="submit" disabled={isSuccess || loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </AuthButton>

              {message && (
                isSuccess ? (
                  <SuccessMessage>
                    {message}
                    <br />
                    <small>Redirecting to login...</small>
                  </SuccessMessage>
                ) : (
                  <ErrorMessage>{message}</ErrorMessage>
                )
              )}
            </StyledForm>

            <BackToLogin onClick={handleBackToLogin}>
              Back to Login
            </BackToLogin>
          </ResetCard>
        </Container>
      </PageContainer>
      <Footer />
    </>
  )
}

export default ResetPasswordPage
