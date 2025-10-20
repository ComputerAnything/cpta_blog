import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Form, Button } from 'react-bootstrap'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { setLoading, openModal } from '../../redux/slices/authSlice'
import API from '../../services/api'

const PageContainer = styled.div`
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  padding: 2rem 0;
`

const ResetCard = styled.div`
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2.5rem;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`

const Title = styled.h2`
  color: #00ff41;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 700;
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 2rem;
`

const StyledForm = styled(Form)`
  .form-label {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .form-control {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.75rem;

    &:focus {
      background: rgba(255, 255, 255, 0.08);
      border-color: #00ff41;
      box-shadow: 0 0 0 0.2rem rgba(0, 255, 65, 0.25);
      color: white;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
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
    }

    input {
      padding-right: 50px;
    }
  }
`

const AuthButton = styled(Button)`
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  border: none;
  color: #000;
  font-weight: 600;
  padding: 0.75rem;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background: linear-gradient(135deg, #00cc33 0%, #00aa2b 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.5);
  }
`

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: #ff6b6b;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const SuccessMessage = styled.div`
  background: rgba(40, 167, 69, 0.2);
  border: 1px solid rgba(40, 167, 69, 0.5);
  color: #00ff41;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
`

const PasswordRequirements = styled.ul`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding-left: 1.25rem;

  li {
    margin-bottom: 0.25rem;
  }
`

const BackToLogin = styled.button`
  background: none;
  border: none;
  color: #00ff41;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  display: block;
  margin: 1.5rem auto 0;

  &:hover {
    color: #00cc33;
  }
`

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setIsSuccess(false)

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long')
      return
    }

    dispatch(setLoading(true))

    try {
      const response = await API.post('/reset-password', { token, password })
      setMessage(response.data.msg || 'Password has been reset successfully')
      setIsSuccess(true)
      setPassword('')
      setConfirmPassword('')

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/')
        dispatch(openModal('login'))
      }, 3000)
    } catch (error: any) {
      setMessage(error.response?.data?.msg || 'Failed to reset password. The link may have expired.')
      setIsSuccess(false)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleBackToLogin = () => {
    navigate('/')
    dispatch(openModal('login'))
  }

  return (
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
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              <PasswordRequirements>
                <li>At least 8 characters long</li>
                <li>Mix of letters, numbers, and symbols recommended</li>
              </PasswordRequirements>
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
                  {showConfirmPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </Form.Group>

            <AuthButton type="submit" disabled={isSuccess}>
              Reset Password
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
  )
}

export default ResetPassword
