import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import api, { authAPI, userAPI } from '../services/api'
import type { User } from '../types'
import logger from '../utils/logger'
import { getErrorStatus } from '../utils/errors'
import { useSessionTimer } from '../hooks/useSessionTimer'
import SessionWarningModal from '../components/features/auth/components/SessionWarningModal'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (userData: User, sessionExpiresAt?: number) => void
  logout: (skipRedirect?: boolean) => void
  updateUser: (userData: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showWarningModal, setShowWarningModal] = useState(false)

  // Handle session expiry - clear auth and redirect to landing page with banner
  const handleSessionExpire = useCallback(async () => {
    logger.info('Session expired proactively after 4 hours')
    // Clear session timer from localStorage to prevent redirect loop
    localStorage.removeItem('session_expires_at')
    // Clear state immediately to prevent flash of stale UI before redirect
    setUser(null)
    setIsAuthenticated(false)
    setShowWarningModal(false)

    // Call backend logout to invalidate JWT
    try {
      await authAPI.logout()
    } catch (error) {
      // Ignore errors - we're logging out anyway
      logger.debug('Logout call during expiry failed (expected):', error)
    }

    // Hard redirect - state will be fresh on page reload
    window.location.href = '/?banner=session-expired'
  }, [])

  // Handle session warning - show modal 5 minutes before expiry
  const handleSessionWarning = useCallback(() => {
    logger.info('Session warning triggered')
    setShowWarningModal(true)
  }, [])

  // Initialize session timer hook
  const { startSession, clearSession, remainingSeconds } = useSessionTimer(
    isAuthenticated,
    handleSessionExpire,
    handleSessionWarning
  )

  // Extend session by calling backend API
  const extendSession = useCallback(async () => {
    try {
      const response = await api.post('/auth/extend-session')
      const newExpiresAt = response.data.sessionExpiresAt

      logger.info('Session extended successfully', { newExpiresAt })

      // Restart session timer with new expiry time
      startSession(newExpiresAt)
      setShowWarningModal(false)
    } catch (error) {
      logger.error('Failed to extend session:', error)
      throw error
    }
  }, [startSession])

  // Check if user is already logged in when app starts
  useEffect(() => {
    let isMounted = true // Prevent state updates if component unmounts

    const checkAuth = async () => {
      try {
        // Try to get user profile - JWT is in httpOnly cookie
        const response = await userAPI.getProfile()
        if (isMounted) {
          setUser(response)
          setIsAuthenticated(true)
          // Session timer automatically recovers from localStorage (no need to call startSession)
        }
      } catch (error: unknown) {
        // Silently fail on 401 (user not logged in)
        const status = getErrorStatus(error)
        if (isMounted && status !== 401) {
          logger.warn('Auth check failed:', error)
        }
        if (isMounted) {
          setUser(null)
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [])

  // Check session validity when tab becomes visible (detects stale sessions)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only check if tab became visible and user was authenticated
      if (!document.hidden && isAuthenticated) {
        try {
          // Silently verify session is still valid
          await userAPI.getProfile()
          // Session still valid - no action needed
        } catch (error) {
          // 401 will be handled by api interceptor
          // It will redirect to /?login=true&message=Session expired...
          // No need to handle here - interceptor does it
          logger.debug('Session check failed on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated])

  // Handle successful login
  const login = (userData: User, sessionExpiresAt?: number) => {
    setUser(userData)
    setIsAuthenticated(true)
    // Start session timer with expiry timestamp from backend
    if (sessionExpiresAt) {
      startSession(sessionExpiresAt)
    }
  }

  // Handle logout - call backend to clear httpOnly cookie
  const logout = async (skipRedirect = false) => {
    // Clear session timer
    clearSession()
    try {
      await authAPI.logout()
    } catch (error) {
      logger.warn('Logout API call failed:', error)
      // Continue with local logout even if API call fails
    }
    setUser(null)
    setIsAuthenticated(false)
    // Redirect to landing page with success banner (unless caller wants to handle redirect)
    if (!skipRedirect) {
      window.location.href = '/?banner=logout-success'
    }
  }

  // Update user data (e.g., after profile update)
  const updateUser = (userData: User) => {
    setUser(userData)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionWarningModal
        show={showWarningModal}
        remainingSeconds={remainingSeconds}
        onExtendSession={extendSession}
        onLogout={logout}
        onHide={() => setShowWarningModal(false)}
      />
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
