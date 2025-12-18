import React from 'react'
import styled, { keyframes } from 'styled-components'
import { useAuth } from '../../contexts/AuthContext'

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const Spinner = styled.div`
  border: 6px solid #f3f3f3;
  border-top: 6px solid #00ff41;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`

const LoadingText = styled.span`
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
`

const LoadingScreen: React.FC = () => {
  const { loading } = useAuth()

  if (!loading) return null

  return (
    <LoadingOverlay>
      <Spinner />
      <LoadingText>Loading...</LoadingText>
    </LoadingOverlay>
  )
}

export default LoadingScreen
