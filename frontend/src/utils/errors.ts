/**
 * Error Handling Utilities
 *
 * Provides type-safe error handling for API calls and other async operations.
 * Uses TypeScript's `unknown` type instead of `any` for better type safety.
 */

import axios, { AxiosError } from 'axios'

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}

/**
 * Extract user-friendly error message from various error types
 *
 * @param error - The caught error (typed as unknown for safety)
 * @param fallback - Fallback message if specific error message not found
 * @returns User-friendly error message string
 *
 * @example
 * try {
 *   await api.get('/endpoint')
 * } catch (err: unknown) {
 *   const message = getErrorMessage(err, 'Failed to load data')
 *   setError(message)
 * }
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  // Axios errors (API responses)
  if (isAxiosError(error)) {
    // Try to get message from response data
    const responseData = error.response?.data as Record<string, unknown> | undefined
    const message = responseData?.message || responseData?.error
    if (message && typeof message === 'string') {
      return message
    }

    // Fallback to HTTP status-based messages
    if (error.response?.status === 401) {
      return 'Authentication required. Please log in.'
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.'
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.'
    }
    if (error.response?.status === 429) {
      return 'Too many requests. Please try again later.'
    }
    if (error.response?.status && error.response.status >= 500) {
      return 'Server error. Please try again later.'
    }

    // Network error
    if (error.message === 'Network Error') {
      return 'Network error. Please check your connection.'
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return error.message
  }

  // Fallback for unknown errors
  return fallback
}

/**
 * Get HTTP status code from error
 *
 * @param error - The caught error
 * @returns HTTP status code or undefined
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status
  }
  return undefined
}

/**
 * Check if error is a specific HTTP status code
 *
 * @param error - The caught error
 * @param status - HTTP status code to check
 * @returns True if error matches status code
 *
 * @example
 * if (isErrorStatus(err, 429)) {
 *   // Handle rate limiting
 * }
 */
export function isErrorStatus(error: unknown, status: number): boolean {
  return getErrorStatus(error) === status
}
