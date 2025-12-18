import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../../../contexts/AuthContext'
import { userAPI, authAPI } from '../../../../services/api'
import type { User, BlogPost } from '../../../../types'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { PageContainer } from '../../../../theme/sharedComponents'
import { PrimaryButton } from '../../../common/StyledButton'
import StyledAlert from '../../../common/StyledAlert'
import Footer from '../../../layout/Footer'

const ProfileHeader = styled.div`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  box-shadow: ${shadows.medium};

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #000;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: ${shadows.button};
`

const UserInfo = styled.div`
  flex: 1;

  h1 {
    color: ${colors.primary};
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .email {
    color: ${colors.text.muted};
    margin-bottom: 1rem;
  }

  .joined {
    color: ${colors.text.muted};
    font-size: 0.9rem;
  }
`

const Stats = styled.div`
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
`

const StatItem = styled.div`
  text-align: center;

  .number {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${colors.primary};
  }

  .label {
    font-size: 0.9rem;
    color: ${colors.text.muted};
  }
`

const PostsSection = styled.div`
  h2 {
    color: ${colors.primary};
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
`

const PostCard = styled.div`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: ${transitions.default};
  cursor: pointer;
  box-shadow: ${shadows.small};

  &:hover {
    border-color: ${colors.border};
    box-shadow: ${shadows.medium};
    transform: translateY(-2px);
  }

  h3 {
    color: ${colors.primary};
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  .post-meta {
    display: flex;
    gap: 1rem;
    color: ${colors.text.muted};
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .post-content {
    color: ${colors.text.secondary};
    line-height: 1.6;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .tag {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid ${colors.borderLight};
    color: ${colors.primary};
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
  }
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${colors.text.muted};
  font-size: 1.1rem;
`

const SettingRow = styled.div`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${shadows.small};
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .setting-info {
    flex: 1;

    h3 {
      color: ${colors.text.primary};
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    p {
      color: ${colors.text.muted};
      font-size: 0.9rem;
      margin: 0;
    }
  }

  input[type="text"] {
    padding: 0.75rem;
    background: ${colors.backgroundDark};
    border: 1px solid ${colors.borderLight};
    border-radius: 8px;
    color: ${colors.text.primary};
    font-size: 1rem;
    min-width: 200px;

    &:focus {
      outline: none;
      border-color: ${colors.primary};
    }
  }
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  cursor: pointer;

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
    transition: 0.4s;
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
    transition: 0.4s;
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

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: currentUser, updateUser } = useAuth()

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Settings state
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch user profile
        const profileData = username
          ? await userAPI.getUserByUsername(username)
          : await userAPI.getProfile()

        setProfile(profileData)

        // Fetch user's posts
        const postsData = username
          ? await userAPI.getUserPosts(username)
          : currentUser?.username
            ? await userAPI.getUserPosts(currentUser.username)
            : []

        setPosts(Array.isArray(postsData) ? postsData : [])
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim() || !currentUser || !currentUser.email) return

    setSettingsLoading(true)
    setSettingsMessage(null)

    try {
      const updatedUser = await userAPI.updateProfile(newUsername.trim(), currentUser.email)
      setProfile(updatedUser)
      updateUser(updatedUser)
      setEditingUsername(false)
      setNewUsername('')
      setSettingsMessage({
        type: 'success',
        text: 'Username updated successfully!'
      })
    } catch (err: unknown) {
      console.error('Failed to update username:', err)
      let errorMessage = 'Failed to update username. It may already be taken.'
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response
        if (response?.data?.error) {
          errorMessage = response.data.error
        }
      }
      setSettingsMessage({
        type: 'error',
        text: errorMessage
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleToggle2FA = async (enable: boolean) => {
    if (!currentUser) return

    setSettingsLoading(true)
    setSettingsMessage(null)

    try {
      await authAPI.toggle2FA(enable)

      // Update local user state
      const updatedUser = { ...currentUser, twofa_enabled: enable }
      updateUser(updatedUser)
      if (profile) {
        setProfile({ ...profile, twofa_enabled: enable })
      }

      setSettingsMessage({
        type: 'success',
        text: `Two-factor authentication has been ${enable ? 'enabled' : 'disabled'} successfully.`
      })
    } catch (err) {
      console.error('Failed to toggle 2FA:', err)
      setSettingsMessage({
        type: 'error',
        text: 'Failed to update two-factor authentication setting. Please try again.'
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageContainer>
          <LoadingMessage>Loading profile...</LoadingMessage>
        </PageContainer>
        <Footer />
      </>
    )
  }

  if (error || !profile) {
    return (
      <>
        <PageContainer>
          <div style={{ padding: '2rem' }}>
            <StyledAlert variant="danger">{error || 'Profile not found'}</StyledAlert>
          </div>
        </PageContainer>
        <Footer />
      </>
    )
  }

  const isOwnProfile = !username || (currentUser && currentUser.username === username)

  return (
    <>
      <PageContainer>
        <div className="container">
          <ProfileHeader>
            <Avatar>{profile.username.charAt(0).toUpperCase()}</Avatar>
            <UserInfo>
              <h1>@{profile.username}</h1>
              {isOwnProfile && profile.email && (
                <div className="email">{profile.email}</div>
              )}
              <div className="joined">
                Member since {new Date(profile.created_at || '').toLocaleDateString()}
              </div>
              <Stats>
                <StatItem>
                  <div className="number">{posts.length}</div>
                  <div className="label">Posts</div>
                </StatItem>
                <StatItem>
                  <div className="number">
                    {posts.reduce((sum, post) => sum + post.upvotes + post.downvotes, 0)}
                  </div>
                  <div className="label">Total Votes</div>
                </StatItem>
              </Stats>
            </UserInfo>
          </ProfileHeader>

          {isOwnProfile && (
            <PostsSection>
              <h2>Settings</h2>

              {settingsMessage && (
                <StyledAlert
                  variant={settingsMessage.type === 'success' ? 'success' : 'danger'}
                  dismissible
                  onClose={() => setSettingsMessage(null)}
                >
                  {settingsMessage.text}
                </StyledAlert>
              )}

              <SettingRow>
                <div className="setting-info">
                  <h3>Username</h3>
                  <p>Update your username (must be unique)</p>
                </div>
                {!editingUsername ? (
                  <PrimaryButton onClick={() => {
                    setEditingUsername(true)
                    setNewUsername(profile.username)
                  }}>
                    Edit Username
                  </PrimaryButton>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      disabled={settingsLoading}
                      placeholder="New username"
                    />
                    <PrimaryButton
                      onClick={handleUsernameUpdate}
                      disabled={settingsLoading || !newUsername.trim() || newUsername === profile.username}
                    >
                      {settingsLoading ? 'Saving...' : 'Save'}
                    </PrimaryButton>
                    <PrimaryButton
                      onClick={() => {
                        setEditingUsername(false)
                        setNewUsername('')
                        setSettingsMessage(null)
                      }}
                      disabled={settingsLoading}
                    >
                      Cancel
                    </PrimaryButton>
                  </div>
                )}
              </SettingRow>

              <SettingRow>
                <div className="setting-info">
                  <h3>Two-Factor Authentication</h3>
                  <p>
                    {currentUser?.twofa_enabled
                      ? 'You will receive a verification code via email when logging in'
                      : 'Add an extra layer of security to your account by requiring a verification code sent to your email'}
                  </p>
                </div>

                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={currentUser?.twofa_enabled || false}
                    onChange={(e) => handleToggle2FA(e.target.checked)}
                    disabled={settingsLoading}
                  />
                  <span className="slider"></span>
                </ToggleSwitch>
              </SettingRow>
            </PostsSection>
          )}

          <PostsSection>
            <h2>{isOwnProfile ? 'My Posts' : `@${profile.username}'s Posts`}</h2>

            {posts.length === 0 ? (
              <LoadingMessage>
                {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't created any posts yet."}
              </LoadingMessage>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
                  <h3>{post.title}</h3>
                  <div className="post-meta">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{post.upvotes - post.downvotes} votes</span>
                  </div>
                  <div className="post-content">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 ? '...' : ''}
                  </div>
                  {post.topic_tags && (
                    <div className="tags">
                      {post.topic_tags.split(',').map((tag, idx) => (
                        <span key={idx} className="tag">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </PostCard>
              ))
            )}
          </PostsSection>
        </div>
      </PageContainer>
      <Footer />
    </>
  )
}

export default ProfilePage
