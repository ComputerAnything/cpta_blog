import { useState, useEffect, useRef } from 'react'
import logger from '../utils/logger'

interface UseTurnstileOptions {
  sitekey?: string
  onSuccess?: (token: string) => void
  onError?: () => void
}

interface UseTurnstileReturn {
  turnstileRef: React.RefObject<HTMLDivElement | null>
  turnstileLoaded: boolean
  turnstileWidgetId: string | null
  getToken: () => string | undefined
  reset: () => void
}

export function useTurnstile(isVisible: boolean, options?: UseTurnstileOptions): UseTurnstileReturn {
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null)
  const [turnstileLoaded, setTurnstileLoaded] = useState(false)
  const turnstileRef = useRef<HTMLDivElement>(null)

  const sitekey = options?.sitekey || import.meta.env.VITE_TURNSTILE_SITE_KEY

  // Wait for Cloudflare Turnstile to be available (loaded in index.html)
  useEffect(() => {
    // Check if turnstile is already available
    if (window.turnstile) {
      setTurnstileLoaded(true)
      return
    }

    // Script is loading from index.html, wait for it
    const checkTurnstile = () => {
      if (window.turnstile) {
        setTurnstileLoaded(true)
      } else {
        setTimeout(checkTurnstile, 100)
      }
    }
    checkTurnstile()
  }, [])

  // Render Turnstile widget when script is loaded and ref is available
  useEffect(() => {
    if (!turnstileLoaded || !window.turnstile || !turnstileRef.current || !isVisible) {
      return
    }

    // Clear any existing widget first
    if (turnstileRef.current) {
      turnstileRef.current.innerHTML = ''
    }

    // Reset widget ID to force re-render
    setTurnstileWidgetId(null)

    // Small delay to ensure DOM is ready
    const renderTimeout = setTimeout(() => {
      if (turnstileRef.current && isVisible && window.turnstile) {
        try {
          const widgetId = window.turnstile.render(turnstileRef.current, {
            sitekey,
            callback: function(token: string) {
              logger.debug('Turnstile token received:', token.substring(0, 20) + '...')
              options?.onSuccess?.(token)
            },
            'error-callback': function() {
              logger.error('Turnstile widget error')
              options?.onError?.()
            }
          })
          if (widgetId) {
            setTurnstileWidgetId(widgetId)
          }
        } catch (error) {
          logger.error('Failed to render Turnstile widget:', error)
        }
      }
    }, 100)

    return () => {
      clearTimeout(renderTimeout)
    }
  }, [turnstileLoaded, isVisible, sitekey, options])

  // Cleanup widget when component unmounts or becomes invisible
  useEffect(() => {
    if (!isVisible && turnstileWidgetId && window.turnstile) {
      try {
        window.turnstile.reset(turnstileWidgetId)
        setTurnstileWidgetId(null)
      } catch (e) {
        logger.warn('Turnstile reset error (safe to ignore):', e)
      }
    }
  }, [isVisible, turnstileWidgetId])

  // Get the current turnstile token
  const getToken = (): string | undefined => {
    if (!window.turnstile || !turnstileWidgetId) {
      return undefined
    }
    try {
      return window.turnstile.getResponse(turnstileWidgetId)
    } catch (e) {
      logger.error('Failed to get Turnstile token:', e)
      return undefined
    }
  }

  // Reset the turnstile widget
  const reset = () => {
    if (window.turnstile && turnstileWidgetId) {
      try {
        window.turnstile.reset(turnstileWidgetId)
      } catch (e) {
        logger.warn('Failed to reset Turnstile:', e)
      }
    }
  }

  return {
    turnstileRef,
    turnstileLoaded,
    turnstileWidgetId,
    getToken,
    reset
  }
}
