import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api, { authAPI } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (userData: User) => void
  logout: () => void
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

  // Check if user is already logged in when app starts
  useEffect(() => {
    let isMounted = true // Prevent state updates if component unmounts

    const checkAuth = async () => {
      try {
        // Try to get user profile - JWT is in httpOnly cookie
        const response = await api.get('/profile')
        if (isMounted) {
          setUser(response.data)
          setIsAuthenticated(true)
        }
      } catch (error: unknown) {
        // Silently fail on 401 (user not logged in)
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

  // Handle successful login
  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  // Handle logout - call backend to clear httpOnly cookie
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.warn('Logout API call failed:', error)
      // Continue with local logout even if API call fails
    }
    setUser(null)
    setIsAuthenticated(false)
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
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
