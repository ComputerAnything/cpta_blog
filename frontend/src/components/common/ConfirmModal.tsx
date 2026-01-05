import { Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { colors, shadows } from '../../theme/colors'
import { PrimaryButton, SecondaryButton } from './StyledButton'

const StyledConfirmModal = styled(Modal)`
  .modal-content {
    background: ${colors.backgroundAlt};
    border: 2px solid ${colors.danger};
    color: ${colors.text.primary};
    box-shadow: ${shadows.large};
  }

  .modal-header {
    border-bottom: 1px solid ${colors.borderDark};
    padding: 1.5rem;

    .modal-title {
      color: ${colors.danger};
      font-weight: 700;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-close {
      filter: invert(1);
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  }

  .modal-body {
    padding: 1.5rem;
    font-size: 1rem;
    line-height: 1.6;
    color: ${colors.text.primary};
  }

  .modal-footer {
    border-top: 1px solid ${colors.borderDark};
    padding: 1rem 1.5rem;
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
  }
`

const WarningIcon = styled.i`
  color: ${colors.danger};
  font-size: 1.5rem;
`

type ConfirmModalProps = {
  show: boolean
  onHide: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm()
    onHide()
  }

  return (
    <StyledConfirmModal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <WarningIcon className={`bi bi-${variant === 'danger' ? 'exclamation-triangle' : 'exclamation-circle'}-fill`} />
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <SecondaryButton onClick={onHide}>
          {cancelText}
        </SecondaryButton>
        <PrimaryButton onClick={handleConfirm} style={{ background: colors.danger }}>
          {confirmText}
        </PrimaryButton>
      </Modal.Footer>
    </StyledConfirmModal>
  )
}

export default ConfirmModal
