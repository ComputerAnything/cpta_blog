import React from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { openModal, setGuest } from '../../redux/slices/authSlice'
import LoginModal from '../auth/LoginModal'
import RegisterModal from '../auth/RegisterModal'
import ForgotPasswordModal from '../auth/ForgotPasswordModal'

const LandingContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a);
  background-image: url('/img/cpt-anything-transparent.png');
  background-size: 864px;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;

  @media (max-width: 768px) {
    background-size: 550px;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1;
  }
`

const ContentCard = styled.div`
  position: relative;
  z-index: 2;
  min-width: 350px;
  max-width: 500px;
  width: 100%;
  padding: 3rem 2rem;
  background: rgba(20, 20, 20, 0.82);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  color: white;
  text-align: center;

  @media (max-width: 576px) {
    min-width: auto;
    padding: 2rem 1.5rem;
  }
`

const Logo = styled.img`
  height: 120px;
  width: auto;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 20px rgba(0, 255, 65, 0.3));

  &:hover {
    transform: scale(1.05);
    filter: drop-shadow(0 6px 30px rgba(0, 255, 65, 0.5));
  }

  @media (max-width: 576px) {
    height: 60px;
  }
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 576px) {
    font-size: 2rem;
  }
`

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #ffffff90;
  margin-bottom: 2.5rem;
  line-height: 1.6;
`

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const AuthButton = styled.button`
  padding: 0.9rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.primary {
    background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
    color: #000;
    box-shadow: 0 8px 20px rgba(0, 255, 65, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0, 255, 65, 0.4);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
  }
`

const FeatureList = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
`

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  color: #ffffff80;

  i {
    color: #00ff41;
    font-size: 1.2rem;
    margin-right: 1rem;
    width: 24px;
    text-align: center;
  }
`

const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { modal } = useAppSelector((state) => state.auth)

  const handleGuestMode = () => {
    dispatch(setGuest())
    localStorage.setItem('guest', 'true')
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userId')
    navigate('/posts')
  }

  return (
    <>
      <LandingContainer>
        <ContentCard>
          <Logo src="/img/cpt-anything-transparent.png" alt="Computer Anything" />
          <Title>Welcome to Our Tech Blog</Title>
          <Subtitle>
            Share your insights, learn from others, and stay updated with the latest in technology.
          </Subtitle>

          <ButtonGroup>
            <AuthButton className="primary" onClick={() => dispatch(openModal('register'))}>
              Get Started
            </AuthButton>
            <AuthButton className="secondary" onClick={() => dispatch(openModal('login'))}>
              Sign In
            </AuthButton>
            <AuthButton className="secondary" onClick={handleGuestMode}>
              Browse as Guest
            </AuthButton>
          </ButtonGroup>

          <FeatureList>
            <FeatureItem>
              <i className="bi bi-pencil-square"></i>
              <span>Write technical articles</span>
            </FeatureItem>
            <FeatureItem>
              <i className="bi bi-people"></i>
              <span>Connect with fellow developers</span>
            </FeatureItem>
            <FeatureItem>
              <i className="bi bi-code-slash"></i>
              <span>Syntax highlighting for code snippets</span>
            </FeatureItem>
            <FeatureItem>
              <i className="bi bi-bookmark"></i>
              <span>Save and organize your favorite posts</span>
            </FeatureItem>
          </FeatureList>
        </ContentCard>
      </LandingContainer>

      {/* Modals */}
      {modal === 'login' && <LoginModal />}
      {modal === 'register' && <RegisterModal />}
      {modal === 'forgotPassword' && <ForgotPasswordModal />}
    </>
  )
}

export default LandingPage
