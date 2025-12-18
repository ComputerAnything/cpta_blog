// ============================================================================
// Theme Colors - Centralized Color System
// ============================================================================

// ----------------------------------------------------------------------------
// Primary Brand Colors
// ----------------------------------------------------------------------------

export const colors = {
  // Primary brand colors
  primary: '#28a745',
  primaryDark: '#18b183ff',
  primaryLight: '#048a408f',

  // Background colors
  background: '#0f0f0f',
  backgroundAlt: '#1a1a1a',
  backgroundLight: '#2a2a2a',
  backgroundDark: '#030303ff',  // Darker background for client portal
  backgroundBlack: '#000000ff',  // Pure black
  backgroundTinted: 'rgba(40, 167, 69, 0.02)',  // Subtle green tint for sections

  // Border colors
  border: 'rgba(40, 167, 69, 0.3)',
  borderLight: 'rgba(40, 167, 69, 0.2)',
  borderDark: '#333',
  borderMedium: '#555',  // Medium border for inputs
  borderInput: '#444',

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    muted: '#888',
    mutedDark: '#666',  // Darker muted text
    mutedLight: '#999',  // Lighter muted text
    light: '#e0e0e0',  // Light gray text for admin
  },

  // State colors
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',

  // Password strength colors
  strength: {
    none: '#666',
    weak: '#dc3545',     // red
    fair: '#ffc107',     // yellow
    good: '#28a745',     // green
    strong: '#20c997',   // teal
  },

  // Interactive states
  hover: 'rgba(40, 167, 69, 0.1)',
  hoverDark: 'rgba(40, 167, 69, 0.15)',
  focus: 'rgba(40, 167, 69, 0.25)',
} as const

// ----------------------------------------------------------------------------
// Gradients
// ----------------------------------------------------------------------------

export const gradients = {
  primary: 'linear-gradient(135deg, #28a745, #18b183ff)',
  primaryReverse: 'linear-gradient(135deg, #18b183ff, #28a745)',
  secondary: 'linear-gradient(135deg, #28a745, #048a408f)',
  secondaryReverse: 'linear-gradient(135deg, #048a408f, #28a745)',
  gray: 'linear-gradient(135deg, #6c757d, #495057)',  // Gray gradient for secondary buttons
  grayReverse: 'linear-gradient(135deg, #495057, #6c757d)',  // Reverse gray gradient
  text: 'linear-gradient(135deg, white, #e8e8e8)',
  navbarAccent: 'linear-gradient(90deg, transparent, #28a745, transparent)',
} as const

// ----------------------------------------------------------------------------
// Shadows
// ----------------------------------------------------------------------------

export const shadows = {
  small: '0 2px 8px rgba(0, 0, 0, 0.2)',
  medium: '0 4px 15px rgba(0, 0, 0, 0.3)',
  large: '0 8px 25px rgba(40, 167, 69, 0.4)',
  navbar: '0 2px 20px rgba(0, 0, 0, 0.3)',
  navbarScrolled: '0 4px 30px rgba(0, 0, 0, 0.5)',
  focus: '0 0 0 0.2rem rgba(40, 167, 69, 0.25)',
  button: '0 4px 12px rgba(40, 167, 69, 0.3)',
  buttonHover: '0 8px 25px rgba(40, 167, 69, 0.4)',
} as const

// ----------------------------------------------------------------------------
// Filters & Effects
// ----------------------------------------------------------------------------

export const effects = {
  backdropBlur: 'blur(15px)',
  backdropBlurStrong: 'blur(20px)',
  invertWhite: 'invert(1)',
} as const

// ----------------------------------------------------------------------------
// Transitions
// ----------------------------------------------------------------------------

export const transitions = {
  default: 'all 0.3s ease',
  fast: 'all 0.2s ease',
  slow: 'all 0.5s ease',
} as const
