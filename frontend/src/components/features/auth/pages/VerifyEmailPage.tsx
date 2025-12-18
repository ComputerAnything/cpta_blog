import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
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

const VerifyCard = styled.div`
  background: ${colors.backgroundAlt};
  backdrop-filter: blur(10px);
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: ${shadows.large};
  text-align: center;
`

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;

  &.success {
    color: ${colors.success};
  }

  &.error {
    color: ${colors.danger};
  }

  &.loading {
    color: #ffc107;
  }
`

const Title = styled.h2`
  color: ${colors.text.primary};
  margin-bottom: 1rem;
  font-weight: 700;
`

const Message = styled.p`
  color: ${colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`

const ActionButton = styled.button`
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
  border: none;
  color: #000;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  transition: ${transitions.fast};
  cursor: pointer;
  font-size: 1rem;
  box-shadow: ${shadows.button};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${shadows.buttonHover};
  }

  &:active {
    transform: translateY(0);
  }
`

const HomeLink = styled.button`
  background: none;
  border: none;
  color: ${colors.primary};
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  margin-left: 1rem;
  transition: ${transitions.default};

  &:hover {
    color: ${colors.primaryDark};
  }
`

interface VerificationStatus {
  type: 'loading' | 'success' | 'error'
  message: string
}

const VerifyEmailPage = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  // const [, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<VerificationStatus>({
    type: 'loading',
    message: 'Verifying your email...',
  })

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus({
          type: 'error',
          message: 'Invalid verification link.',
        })
        return
      }

      try {
        await authAPI.verifyEmail(token)
        setStatus({
          type: 'success',
          message: 'Your email has been successfully verified! You can now log in to your account.',
        })
      } catch (error) {
        console.error('Email verification failed:', error)
        setStatus({
          type: 'error',
          message: 'Verification failed. The link may be invalid or expired.',
        })
      }
    }

    verifyEmail()
  }, [token])

  const handleLogin = () => {
    navigate('/?login=true')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <>
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
      <Footer />
    </>
  )
}

export default VerifyEmailPage
