import { useEffect, useCallback, useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { SESSION_CHECK_INTERVAL_MS } from '../constants/timeouts'
import logger from '../utils/logger'

const SESSION_EXPIRES_AT_KEY = 'session_expires_at'
const WARNING_TIME_SECONDS = 5 * 60 // Show warning 5 minutes before expiry (5 * 60 = 300 seconds)

/**
 * Custom hook for managing proactive session expiry with warning
 *
 * Uses the session expiry timestamp from the backend (single source of truth)
 * to automatically trigger logout when the session expires. Shows a warning
 * modal 5 minutes before expiry to allow manual session extension.
 *
 * @param isAuthenticated - Whether user is currently authenticated
 * @param onExpire - Callback to execute when session expires
 * @param onWarning - Callback to execute when warning should be shown (5 min before expiry)
 * @returns {startSession, clearSession, remainingSeconds} - Functions and state
 */
export function useSessionTimer(
  isAuthenticated: boolean,
  onExpire: () => void,
  onWarning?: (remainingSeconds: number) => void
) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [sessionExpiresAt, setSessionExpiresAt, removeSessionExpiresAt] =
    useLocalStorage<number | null>(SESSION_EXPIRES_AT_KEY, null)

  // Start session timer with expiry timestamp from backend (Unix timestamp in seconds)
  const startSession = useCallback((expiresAtSeconds: number) => {
    setSessionExpiresAt(expiresAtSeconds)
    const expiryDate = new Date(expiresAtSeconds * 1000)
    logger.debug('Session timer started, expires at:', expiryDate.toISOString())
  }, [setSessionExpiresAt])

  // Clear session timer (call on logout)
  const clearSession = useCallback(() => {
    removeSessionExpiresAt()
    logger.debug('Session timer cleared')
  }, [removeSessionExpiresAt])

  // Main timer effect - sets up warning, expiry timer, and periodic check
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) {
      setRemainingSeconds(0)
      return
    }

    const nowSeconds = Math.floor(Date.now() / 1000)
    const timeRemainingSeconds = sessionExpiresAt - nowSeconds

    // Already expired - trigger immediately
    if (timeRemainingSeconds <= 0) {
      logger.info('Session already expired, triggering expiry now')
      onExpire()
      return
    }

    logger.debug(
      `Session will expire in ${Math.floor(timeRemainingSeconds / 60)} minutes`
    )

    // Set warning timer (5 minutes before expiry)
    let warningTimer: number | null = null
    let countdownInterval: number | null = null
    const timeUntilWarningMs = (timeRemainingSeconds - WARNING_TIME_SECONDS) * 1000

    if (timeUntilWarningMs > 0 && onWarning) {
      // Schedule warning for 5 minutes before expiry
      warningTimer = setTimeout(() => {
        logger.info('Session warning triggered (5 minutes remaining)')
        setRemainingSeconds(WARNING_TIME_SECONDS)
        onWarning(WARNING_TIME_SECONDS)

        // Start countdown timer (updates every second during warning period)
        countdownInterval = setInterval(() => {
          const currentSeconds = Math.floor(Date.now() / 1000)
          const remaining = sessionExpiresAt - currentSeconds
          if (remaining > 0) {
            setRemainingSeconds(remaining)
          }
        }, 1000)
      }, timeUntilWarningMs)
    } else if (timeRemainingSeconds <= WARNING_TIME_SECONDS && onWarning) {
      // Already in warning period - show immediately
      logger.info('Session in warning period, showing warning now')
      setRemainingSeconds(timeRemainingSeconds)
      onWarning(timeRemainingSeconds)

      // Start countdown timer immediately
      countdownInterval = setInterval(() => {
        const currentSeconds = Math.floor(Date.now() / 1000)
        const remaining = sessionExpiresAt - currentSeconds
        if (remaining > 0) {
          setRemainingSeconds(remaining)
        }
      }, 1000)
    }

    // Set exact expiry timer
    const expiryTimer = setTimeout(() => {
      logger.info('Session expired (setTimeout)')
      onExpire()
    }, timeRemainingSeconds * 1000)

    // Periodic check every minute (handles drift + system sleep)
    const checkInterval = setInterval(() => {
      const currentSeconds = Math.floor(Date.now() / 1000)
      if (currentSeconds >= sessionExpiresAt) {
        logger.info('Session expired (setInterval check)')
        onExpire()
      }
    }, SESSION_CHECK_INTERVAL_MS)

    return () => {
      if (warningTimer) clearTimeout(warningTimer)
      if (countdownInterval) clearInterval(countdownInterval)
      clearTimeout(expiryTimer)
      clearInterval(checkInterval)
    }
  }, [isAuthenticated, sessionExpiresAt, onExpire, onWarning])

  // Cross-tab logout sync (when another tab logs out)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_EXPIRES_AT_KEY && e.newValue === null) {
        logger.info('Session cleared in another tab, syncing logout')
        onExpire()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [onExpire])

  return { startSession, clearSession, remainingSeconds }
}
