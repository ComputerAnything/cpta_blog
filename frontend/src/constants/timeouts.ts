// ============================================================================
// Timeout & Timing Constants
// ============================================================================

export const REDIRECT_DELAY = 1500
export const TOAST_DISPLAY_TIME = 2000
export const TOAST_TIMEOUT = 2000
export const DEBOUNCE_DELAY = 300

// Session timer constants
// Session expiry timestamp comes from backend login response (single source of truth)
// Frontend just needs to check periodically if session has expired
export const SESSION_CHECK_INTERVAL_MS = 60 * 1000 // Check every minute
