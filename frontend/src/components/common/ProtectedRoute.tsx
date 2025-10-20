import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../../redux/hooks'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, token, isGuest, hydrated } = useAppSelector((state) => state.auth)

  // Wait for Redux state to hydrate from localStorage before rendering
  if (!hydrated) return null

  // Allow access if authenticated (token) or guest
  if ((!user || !token) && !isGuest) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
