import { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import styled from 'styled-components'
import { userAPI, authAPI } from '../../../../services/api'
import { getErrorMessage } from '../../../../utils/errors'
import type { User } from '../../../../types'
import StyledAlert from '../../../common/StyledAlert'
import { StyledModal } from '../../../common/StyledModal'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
import ChangePasswordModal from '../../auth/components/ChangePasswordModal'
import ConfirmModal from '../../../common/ConfirmModal'
import { colors, transitions } from '../../../../theme/colors'

interface ProfileSettingsModalProps {
  show: boolean
  onHide: () => void
  user: User
  onProfileUpdate: (user: User) => void
  onAccountDeleted: () => void
}

const StyledModalExtended = styled(StyledModal)`
  .modal-dialog {
    max-width: 550px;
  }
`

const SettingSection = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${colors.borderLight};

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h4 {
    color: ${colors.text.primary};
    font-size: 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  p {
    color: ${colors.text.muted};
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
`

const DangerSection = styled(SettingSection)`
  border-color: ${colors.danger};
  background: rgba(220, 53, 69, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;

  h4 {
    color: ${colors.danger};
  }
`

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`

const UsernameInput = styled.input`
  padding: 0.75rem;
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  color: ${colors.text.primary};
  font-size: 1rem;
  flex: 1;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${colors.primary};
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  cursor: pointer;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${colors.backgroundDark};
    transition: ${transitions.default};
    border-radius: 34px;
    border: 2px solid ${colors.borderLight};
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 2px;
    background-color: ${colors.text.muted};
    transition: ${transitions.default};
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: ${colors.primary};
    border-color: ${colors.primary};
  }

  input:checked + .slider:before {
    background-color: #000;
    transform: translateX(24px);
  }

  input:disabled + .slider {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  show,
  onHide,
  user,
  onProfileUpdate,
  onAccountDeleted
}) => {
  // Username editing
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')

  // Loading and messages
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Nested modals
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setEditingUsername(false)
      setNewUsername('')
      setMessage(null)
    }
  }, [show])

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim() || !user.email) return

    setLoading(true)
    setMessage(null)

    try {
      const updatedUser = await userAPI.updateProfile(newUsername.trim(), user.email)
      onProfileUpdate(updatedUser)
      setEditingUsername(false)
      setNewUsername('')
      setMessage({ type: 'success', text: 'Username updated successfully!' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to update username. It may already be taken.')
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle2FA = async (enable: boolean) => {
    setLoading(true)
    setMessage(null)

    try {
      await authAPI.toggle2FA(enable)
      const updatedUser = { ...user, twofa_enabled: enable }
      onProfileUpdate(updatedUser)
      setMessage({
        type: 'success',
        text: `Two-factor authentication has been ${enable ? 'enabled' : 'disabled'}.`
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to update two-factor authentication. Please try again.') 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await userAPI.deleteProfile()
      onAccountDeleted()
    } catch (err) {
      setMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to delete account. Please try again.')
      })
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEditingUsername(false)
      setNewUsername('')
      setMessage(null)
      onHide()
    }
  }

  return (
    <>
      <StyledModalExtended show={show && !showChangePassword && !showDeleteConfirm} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-gear me-2"></i>
            Profile Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message && (
            <StyledAlert
              variant={message.type === 'success' ? 'success' : 'danger'}
              dismissible
              onClose={() => setMessage(null)}
              className="mb-3"
            >
              <strong>{message.type === 'success' ? 'Success' : 'Update Failed'}</strong>
              {message.text}
            </StyledAlert>
          )}

          {/* Username Section */}
          <SettingSection>
            <h4>
              <i className="bi bi-person"></i>
              Username
            </h4>
            <p>Change your username (must be unique, lowercase, 3-20 characters)</p>
            <SettingRow>
              {!editingUsername ? (
                <>
                  <span style={{ color: colors.text.secondary }}>@{user.username}</span>
                  <PrimaryButton
                    onClick={() => {
                      setEditingUsername(true)
                      setNewUsername(user.username)
                    }}
                    disabled={loading}
                  >
                    Edit
                  </PrimaryButton>
                </>
              ) : (
                <>
                  <UsernameInput
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    maxLength={20}
                    disabled={loading}
                    placeholder="New username"
                    autoFocus
                  />
                  <ButtonGroup>
                    <PrimaryButton
                      onClick={handleUsernameUpdate}
                      disabled={loading || !newUsername.trim() || newUsername === user.username}
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => {
                        setEditingUsername(false)
                        setNewUsername('')
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </SecondaryButton>
                  </ButtonGroup>
                </>
              )}
            </SettingRow>
          </SettingSection>

          {/* Security Section */}
          <SettingSection>
            <h4>
              <i className="bi bi-shield-lock"></i>
              Security
            </h4>

            {/* Password */}
            <p>Update your password to keep your account secure</p>
            <SettingRow style={{ marginBottom: '1.5rem' }}>
              <span style={{ color: colors.text.secondary }}>Password</span>
              <PrimaryButton onClick={() => setShowChangePassword(true)} disabled={loading}>
                Change Password
              </PrimaryButton>
            </SettingRow>

            {/* 2FA */}
            <p>
              {user.twofa_enabled
                ? 'A verification code will be sent to your email when logging in'
                : 'Add extra security by requiring a verification code sent to your email'}
            </p>
            <SettingRow>
              <span style={{ color: colors.text.secondary }}>Two-Factor Authentication</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={user.twofa_enabled || false}
                  onChange={(e) => handleToggle2FA(e.target.checked)}
                  disabled={loading}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </SettingRow>
          </SettingSection>

          {/* Danger Zone */}
          <DangerSection>
            <h4>
              <i className="bi bi-exclamation-triangle"></i>
              Danger Zone
            </h4>
            <p>Permanently delete your account and all data. This cannot be undone.</p>
            <PrimaryButton
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: colors.danger, width: '100%' }}
              disabled={loading}
            >
              <i className="bi bi-trash me-2"></i>
              Delete Account
            </PrimaryButton>
          </DangerSection>
        </Modal.Body>

        <Modal.Footer>
          <SecondaryButton onClick={handleClose} disabled={loading}>
            Close
          </SecondaryButton>
        </Modal.Footer>
      </StyledModalExtended>

      {/* Change Password Modal */}
      <ChangePasswordModal
        show={showChangePassword}
        onHide={() => setShowChangePassword(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmModal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This will permanently delete all your posts, comments, and votes. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export default ProfileSettingsModal
