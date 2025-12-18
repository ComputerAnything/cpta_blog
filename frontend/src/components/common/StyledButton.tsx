import React from 'react'
import styled from 'styled-components'
import { Button } from 'react-bootstrap'
import { colors, gradients, shadows, transitions } from '../../theme/colors'

// ============================================================================
// Color Maps for Flexible Buttons
// ============================================================================

const colorMap = {
  danger: {
    background: `linear-gradient(135deg, ${colors.danger}, #c82333)`,
    color: colors.text.primary,
    shadow: 'rgba(220, 53, 69, 0.4)',
    focus: 'rgba(220, 53, 69, 0.25)'
  },
  warning: {
    background: `linear-gradient(135deg, ${colors.warning}, #e0a800)`,
    color: '#000',
    shadow: 'rgba(255, 193, 7, 0.4)',
    focus: 'rgba(255, 193, 7, 0.25)'
  },
  success: {
    background: `linear-gradient(135deg, ${colors.success}, #1e7e34)`,
    color: colors.text.primary,
    shadow: 'rgba(40, 167, 69, 0.4)',
    focus: 'rgba(40, 167, 69, 0.25)'
  },
  gray: {
    background: 'linear-gradient(135deg, #6c757d, #495057)',
    color: colors.text.primary,
    shadow: 'rgba(108, 117, 125, 0.4)',
    focus: 'rgba(108, 117, 125, 0.25)'
  },
  info: {
    background: 'linear-gradient(135deg, #17a2b8, #138496)',
    color: colors.text.primary,
    shadow: 'rgba(23, 162, 184, 0.4)',
    focus: 'rgba(23, 162, 184, 0.25)'
  }
}

// ============================================================================
// Primary Button - Main call-to-action button
// ============================================================================

export const PrimaryButton = styled(Button)`
  background: ${gradients.primary};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  text-decoration: none !important;
  transition: ${transitions.default};
  color: ${colors.text.primary};

  &:hover {
    background: ${gradients.primaryReverse};
    border-color: ${colors.primary};
    transform: translateY(-2px);
    box-shadow: ${shadows.buttonHover};
    color: ${colors.text.primary};
    text-decoration: none !important;
  }

  &:focus {
    background: ${gradients.primary};
    border-color: ${colors.primary};
    box-shadow: ${shadows.focus};
    color: ${colors.text.primary};
  }

  &:active {
    background: ${gradients.primary};
    border-color: ${colors.primary};
    color: ${colors.text.primary};
  }

  &:disabled {
    background: ${colors.backgroundLight} !important;
    border-color: ${colors.text.muted} !important;
    color: ${colors.text.muted} !important;
    cursor: not-allowed;
    transform: none;
    box-shadow: none !important;
  }

  /* Override Bootstrap loading state */
  &[aria-busy="true"],
  &.loading {
    background: ${gradients.primary} !important;
    border-color: ${colors.primary} !important;
    color: ${colors.text.primary} !important;
    box-shadow: none !important;
  }
`

// ============================================================================
// Secondary Button - Alternative action button with gray gradient
// ============================================================================

export const SecondaryButton = styled(PrimaryButton)`
  background: ${gradients.gray};
  font-family: inherit;

  &:hover {
    background: ${gradients.grayReverse};
  }

  &:focus {
    background: ${gradients.gray};
  }

  &:active {
    background: ${gradients.gray};
  }

  /* Override Bootstrap loading state */
  &[aria-busy="true"],
  &.loading {
    background: ${gradients.gray} !important;
    color: ${colors.text.primary} !important;
    box-shadow: none !important;
  }
`

// ============================================================================
// Submit Button - For form submissions
// ============================================================================

export const SubmitButton = styled(Button)`
  background: ${gradients.primary};
  border: 2px solid ${colors.primary};
  font-weight: 600;
  transition: ${transitions.default};
  width: 100%;

  &:hover {
    background: ${gradients.primaryReverse};
    border-color: ${colors.primary};
    box-shadow: ${shadows.button};
  }

  &:focus {
    background: ${gradients.primary};
    border-color: ${colors.primary};
    box-shadow: ${shadows.focus};
  }

  &:disabled {
    background: ${colors.backgroundLight} !important;
    border-color: ${colors.text.muted} !important;
    color: ${colors.text.muted} !important;
    cursor: not-allowed;
    box-shadow: none !important;
  }
`

// ============================================================================
// Add Card Button - For adding payment methods
// ============================================================================

export const AddCardButton = styled(Button)`
  background: ${gradients.primary};
  border: 2px solid ${colors.primary};
  font-weight: 600;
  transition: ${transitions.default};
  color: ${colors.text.primary};

  &:hover {
    background: ${gradients.primaryReverse};
    border-color: ${colors.primary};
    box-shadow: ${shadows.button};
    color: ${colors.text.primary};
  }

  &:focus {
    background: ${gradients.primary};
    border-color: ${colors.primary};
    box-shadow: ${shadows.focus};
    color: ${colors.text.primary};
  }
`

// ============================================================================
// Outline Button - For secondary actions like "Back to Home"
// ============================================================================

export const OutlineButton = styled(Button)`
  background: transparent !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 8px;
  color: white !important;
  font-weight: 600;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  text-decoration: none !important;
  transition: ${transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: white !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
    color: white !important;
    text-decoration: none !important;
  }

  &:focus {
    background: transparent !important;
    border-color: white !important;
    box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
    color: white !important;
  }

  &:focus-visible {
    background: transparent !important;
    border-color: white !important;
    box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
    color: white !important;
  }

  &:active {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: white !important;
    color: white !important;
    box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
  }

  &.active {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: white !important;
    color: white !important;
  }

  &:disabled {
    background: transparent !important;
    border-color: ${colors.text.muted} !important;
    color: ${colors.text.muted} !important;
    cursor: not-allowed;
    box-shadow: none !important;
  }

  /* Override Bootstrap loading state */
  &[aria-busy="true"],
  &.loading {
    background: transparent !important;
    border-color: white !important;
    color: white !important;
    box-shadow: none !important;
  }
`

// ============================================================================
// Link Buttons - Styled links that look like buttons
// ============================================================================

export const PrimaryLinkButton = styled.a`
  display: inline-block;
  background: ${gradients.primary};
  border: 2px solid ${colors.primary};
  border-radius: 8px;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  text-decoration: none !important;
  transition: ${transitions.default};
  color: ${colors.text.primary};
  cursor: pointer;

  &:hover {
    background: ${gradients.primaryReverse};
    border-color: ${colors.primary};
    transform: translateY(-2px);
    box-shadow: ${shadows.buttonHover};
    color: ${colors.text.primary};
    text-decoration: none !important;
  }

  &:focus {
    background: ${gradients.primary};
    border-color: ${colors.primary};
    box-shadow: ${shadows.focus};
    color: ${colors.text.primary};
    text-decoration: none !important;
  }

  &:active {
    background: ${gradients.primary};
    border-color: ${colors.primary};
    color: ${colors.text.primary};
    text-decoration: none !important;
  }

  /* Size variants */
  &.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  &.btn-lg {
    padding: 0.5rem 1rem;
    font-size: 1.25rem;
  }
`

export const OutlineLinkButton = styled.a`
  display: inline-block;
  background: transparent !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 8px;
  color: white !important;
  font-weight: 600;
  padding: calc(0.375rem - 2px) calc(0.75rem - 2px); /* Adjust for border */
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  text-decoration: none !important;
  transition: ${transitions.default};
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: white !important;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
    color: white !important;
    text-decoration: none !important;
  }

  &:focus {
    background: transparent !important;
    border-color: white !important;
    box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25) !important;
    color: white !important;
    text-decoration: none !important;
  }

  &:active {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: white !important;
    color: white !important;
    text-decoration: none !important;
  }

  /* Size variants */
  &.btn-sm {
    padding: calc(0.25rem - 2px) calc(0.5rem - 2px);
    font-size: 0.875rem;
  }

  &.btn-lg {
    padding: calc(0.5rem - 2px) calc(1rem - 2px);
    font-size: 1.25rem;
  }
`

// ============================================================================
// Flexible Color Button - For any color you want
// ============================================================================

interface ColorButtonProps {
  color?: 'danger' | 'warning' | 'success' | 'gray' | 'info'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'lg'
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export const ColorButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !['color'].includes(prop)
})<ColorButtonProps>`
  background: ${(props) => colorMap[props.color as keyof typeof colorMap || 'gray'].background};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  text-decoration: none !important;
  transition: ${transitions.default};
  color: ${(props) => colorMap[props.color as keyof typeof colorMap || 'gray'].color};

  /* Action button styling when used with action-button class */
  &.action-button {
    padding: 0.75rem 1.5rem;
    margin: 0.5rem;
    white-space: nowrap;
    min-width: 220px;

    @media (max-width: 768px) {
      padding: 0.6rem 1rem;
      font-size: 0.9rem;
      margin: 0.25rem;
      width: 100%;
      min-width: unset;
    }
  }

  &:hover {
    background: ${(props) => colorMap[props.color || 'gray'].background};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${(props) => colorMap[props.color || 'gray'].shadow};
    color: ${(props) => colorMap[props.color || 'gray'].color};
    text-decoration: none !important;
  }

  &:focus {
    background: ${(props) => colorMap[props.color || 'gray'].background};
    box-shadow: 0 0 0 0.2rem ${(props) => colorMap[props.color || 'gray'].focus};
    color: ${(props) => colorMap[props.color || 'gray'].color};
  }

  &:active {
    background: ${(props) => colorMap[props.color || 'gray'].background};
    color: ${(props) => colorMap[props.color || 'gray'].color};
  }

  &:disabled {
    background: ${colors.backgroundLight};
    border-color: ${colors.text.muted};
    color: ${colors.text.muted};
    cursor: not-allowed;
    transform: none;
  }
`

// ============================================================================
// Flexible Color Link Button - Link version of ColorButton
// ============================================================================

interface ColorLinkButtonProps {
  color?: 'danger' | 'warning' | 'success' | 'gray' | 'info'
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  size?: 'sm' | 'lg'
}

export const ColorLinkButton = styled.a.withConfig({
  shouldForwardProp: (prop) => !['color'].includes(prop)
})<ColorLinkButtonProps>`
  display: inline-block;
  background: ${(props) => colorMap[props.color || 'gray'].background};
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  text-decoration: none !important;
  transition: ${transitions.default};
  color: ${(props) => colorMap[props.color || 'gray'].color};
  cursor: pointer;

  &:hover {
    background: ${(props) => colorMap[props.color || 'gray'].background};
    border-color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px ${(props) => colorMap[props.color || 'gray'].shadow};
    color: ${(props) => colorMap[props.color || 'gray'].color};
    text-decoration: none !important;
  }

  &:focus {
    background: ${(props) => colorMap[props.color || 'gray'].background};
    border-color: white;
    box-shadow: 0 0 0 0.2rem ${(props) => colorMap[props.color || 'gray'].focus};
    color: ${(props) => colorMap[props.color || 'gray'].color};
    text-decoration: none !important;
  }

  &:active {
    background: ${(props) => colorMap[props.color || 'gray'].background};
    border-color: white;
    color: ${(props) => colorMap[props.color || 'gray'].color};
    text-decoration: none !important;
  }

  /* Size variants */
  &.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }

  &.btn-lg {
    padding: 0.5rem 1rem;
    font-size: 1.25rem;
  }
`
