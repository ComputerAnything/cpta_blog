import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { openModal } from '../../redux/slices/authSlice'
import axios from 'axios'

const PageContainer = styled.div`
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  padding: 2rem 0;
`

const VerifyCard = styled.div`
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  text-align: center;
`

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;

  &.success {
    color: #00ff41;
  }

  &.error {
    color: #ff6b6b;
  }

  &.loading {
    color: #ffc107;
  }
`

const Title = styled.h2`
  color: white;
  margin-bottom: 1rem;
  font-weight: 700;
`

const Message = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`

const ActionButton = styled.button`
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  border: none;
  color: #000;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background: linear-gradient(135deg, #00cc33 0%, #00aa2b 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
  }
`

const HomeLink = styled.button`
  background: none;
  border: none;
  color: #00ff41;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  margin-left: 1rem;

  &:hover {
    color: #00cc33;
  }
`

interface VerificationStatus {
  type: 'loading' | 'success' | 'error'
  message: string
}

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<VerificationStatus>({
    type: 'loading',
    message: 'Verifying your email...',
  })

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Call the backend verification endpoint (note: not under /api prefix)
        const response = await axios.get(`/verify-email/${token}`)

        if (response.status === 200) {
          setStatus({
            type: 'success',
            message: 'Your email has been successfully verified! You can now log in to your account.',
          })
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.msg || 'Verification failed. The link may be invalid or expired.'
        setStatus({
          type: 'error',
          message: errorMsg,
        })
      }
    }

    if (token) {
      verifyEmail()
    } else {
      setStatus({
        type: 'error',
        message: 'Invalid verification link.',
      })
    }
  }, [token])

  const handleLogin = () => {
    navigate('/')
    dispatch(openModal('login'))
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <PageContainer>
      <Container>
        <VerifyCard>
          <Icon className={status.type}>
            {status.type === 'loading' && '⏳'}
            {status.type === 'success' && '✅'}
            {status.type === 'error' && '❌'}
          </Icon>

          <Title>
            {status.type === 'loading' && 'Verifying Email'}
            {status.type === 'success' && 'Email Verified!'}
            {status.type === 'error' && 'Verification Failed'}
          </Title>

          <Message>{status.message}</Message>

          {status.type === 'success' && (
            <div>
              <ActionButton onClick={handleLogin}>
                Log In Now
              </ActionButton>
              <HomeLink onClick={handleGoHome}>
                Go to Home
              </HomeLink>
            </div>
          )}

          {status.type === 'error' && (
            <div>
              <ActionButton onClick={handleGoHome}>
                Go to Home
              </ActionButton>
            </div>
          )}
        </VerifyCard>
      </Container>
    </PageContainer>
  )
}

export default VerifyEmail
