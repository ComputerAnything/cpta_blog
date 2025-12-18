import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth()

  // Wait for auth check to complete
  if (loading) return null

  // Redirect to home with login modal if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/?login=true&message=Please log in to continue" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
