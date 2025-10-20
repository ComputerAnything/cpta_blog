import React, { useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import { useAppDispatch } from '../../redux/hooks'
import { setGuest, setLoading, closeModal, openModal } from '../../redux/slices/authSlice'
import API from '../../services/api'

const StyledModal = styled(Modal)`
  .modal-content {
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }

  .modal-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-close {
    filter: invert(1);
  }
`

const StyledForm = styled(Form)`
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

const GuestButton = styled(Button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  padding: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
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

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: #00ff41;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: inherit;

  &:hover {
    color: #00cc33;
  }
`

const SuccessView = styled.div`
  text-align: center;
  padding: 2rem;

  h4 {
    color: #00ff41;
    margin-bottom: 1.5rem;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 2rem;
  }
`

const RegisterModal: React.FC = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [registered, setRegistered] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleClose = () => dispatch(closeModal())

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setMessage({ text: 'Please complete the verification challenge.', type: 'error' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' })
      return
    }
    if (honeypot) {
      // Honeypot field filled, likely a bot
      return
    }
    dispatch(setLoading(true))
    try {
      await API.post('/register', {
        username,
        email,
        password,
        turnstile_token: turnstileToken
      })
      setRegistered(true)
      setMessage({
        text: 'Registration successful! Please check your email to verify your account.',
        type: 'success'
      })
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.msg || 'Registration failed. Please try again.',
        type: 'error'
      })
      // Reset turnstile on error
      setTurnstileToken(null)
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleGuest = () => {
    dispatch(setGuest())
    localStorage.setItem('guest', 'true')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    setMessage(null)
    handleClose()
    navigate('/posts')
  }

  const handleGoToLogin = () => {
    dispatch(openModal('login'))
  }

  if (registered) {
    return (
      <StyledModal show onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Registration Complete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SuccessView>
            <h4>Success!</h4>
            <p>{message?.text}</p>
            <AuthButton onClick={handleGoToLogin} className="w-100">
              Go to Login
            </AuthButton>
          </SuccessView>
        </Modal.Body>
      </StyledModal>
    )
  }

  return (
    <StyledModal show onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Register</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <StyledForm onSubmit={handleRegister}>
          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            autoComplete="off"
            tabIndex={-1}
          />

          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Control
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="input-group">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="input-group">
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </Form.Group>

          <div className="mb-3 d-flex justify-content-center">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>

          <AuthButton type="submit" className="w-100 mb-2" disabled={!turnstileToken}>
            Register
          </AuthButton>

          <GuestButton type="button" className="w-100" onClick={handleGuest}>
            Continue as Guest
          </GuestButton>

          {message && (
            message.type === 'success' ? (
              <SuccessMessage>{message.text}</SuccessMessage>
            ) : (
              <ErrorMessage>{message.text}</ErrorMessage>
            )
          )}
        </StyledForm>

        <div className="text-center mt-3">
          Already have an account?{' '}
          <SwitchLink onClick={() => dispatch(openModal('login'))}>
            Login here
          </SwitchLink>
        </div>
      </Modal.Body>
    </StyledModal>
  )
}

export default RegisterModal
