import styled from 'styled-components'
import { Modal } from 'react-bootstrap'
import { colors, shadows, effects } from '../../theme/colors'

// ============================================================================
// StyledModal - Base modal component with consistent theming
// ============================================================================

export const StyledModal = styled(Modal)`
  .modal-content {
    background: ${colors.background};
    border: 1px solid ${colors.primary};
    color: ${colors.text.primary};
  }

  .modal-header {
    border-bottom: 1px solid ${colors.borderDark};

    .modal-title {
      color: ${colors.text.primary};
    }

    .btn-close {
      filter: ${effects.invertWhite};
    }
  }

  .modal-footer {
    border-top: 1px solid ${colors.borderDark};
  }

  .form-label {
    color: ${colors.text.primary};
    font-weight: 500;
  }

  .form-control {
    background: ${colors.backgroundLight};
    border: 1px solid ${colors.borderInput};
    color: ${colors.text.primary};

    &:focus {
      background: ${colors.backgroundLight};
      border-color: ${colors.primary};
      box-shadow: ${shadows.focus};
      color: ${colors.text.primary};
    }

    &::placeholder {
      color: ${colors.text.muted};
    }
  }

  .form-select {
    background: ${colors.backgroundLight};
    border: 1px solid ${colors.borderInput};
    color: ${colors.text.primary};

    &:focus {
      background: ${colors.backgroundLight};
      border-color: ${colors.primary};
      box-shadow: ${shadows.focus};
      color: ${colors.text.primary};
    }

    option {
      background: ${colors.backgroundLight};
      color: ${colors.text.primary};
    }
  }

  .password-toggle {
    background: ${colors.backgroundLight};
    border: 1px solid ${colors.borderInput};
    border-left: none;
    color: ${colors.text.muted};
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      color: ${colors.primary};
      background: ${colors.borderDark};
    }
  }
`
