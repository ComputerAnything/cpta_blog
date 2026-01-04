import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../../../../contexts/AuthContext'
import { userAPI, authAPI, commentAPI } from '../../../../services/api'
import type { User, BlogPost } from '../../../../types'
import { getErrorMessage } from '../../../../utils/errors'
import { colors, shadows, transitions } from '../../../../theme/colors'
import {
  PageContainer,
  BlogPostCard,
  PostHeader,
  PostTitle,
  VoteDisplay,
  PostMeta,
  PostContent,
  TagsContainer,
  Tag,
  LoadingMessage,
} from '../../../../theme/sharedComponents'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
import StyledAlert from '../../../common/StyledAlert'
import ChangePasswordModal from '../../auth/components/ChangePasswordModal'
import ConfirmModal from '../../../common/ConfirmModal'
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
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;

  @media (max-width: 991px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }

  @media (max-width: 576px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    /* Make the last item span 2 columns and center it */
    & > :last-child {
      grid-column: 1 / -1;
      max-width: 200px;
      margin: 0 auto;
    }
  }
`

const StatItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  transition: ${transitions.default};

  &:hover {
    border-color: ${colors.primary};
    transform: translateY(-2px);
  }

  .number {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${colors.primary};
  }

  .label {
    font-size: 0.85rem;
    color: ${colors.text.muted};
    margin-top: 0.25rem;
  }

  @media (max-width: 576px) {
    padding: 0.5rem;

    .number {
      font-size: 1.25rem;
    }

    .label {
      font-size: 0.75rem;
    }
  }
`

const PostsSection = styled.div`
  > h2 {
    color: ${colors.primary};
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
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

  // Stats state
  const [votesMade, setVotesMade] = useState(0)
  const [commentsMade, setCommentsMade] = useState(0)
  const [commentsReceived, setCommentsReceived] = useState(0)

  // Settings state
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

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

        const targetUsername = username || currentUser?.username

        if (targetUsername) {
          // Fetch user's posts, votes, and comments in parallel
          const [postsData, votesCount, commentsCount] = await Promise.all([
            userAPI.getUserPosts(targetUsername),
            userAPI.getUserVotesCount(targetUsername),
            userAPI.getUserCommentsCount(targetUsername)
          ])

          setPosts(Array.isArray(postsData) ? postsData : [])
          setVotesMade(votesCount)
          setCommentsMade(commentsCount)

          // Calculate comments received on user's posts
          if (Array.isArray(postsData) && postsData.length > 0) {
            const commentCounts = await Promise.all(
              postsData.map(async (post) => {
                try {
                  const comments = await commentAPI.getComments(post.id)
                  return Array.isArray(comments) ? comments.length : 0
                } catch {
                  return 0
                }
              })
            )
            setCommentsReceived(commentCounts.reduce((sum, count) => sum + count, 0))
          } else {
            setCommentsReceived(0)
          }
        } else {
          setPosts([])
          setVotesMade(0)
          setCommentsMade(0)
          setCommentsReceived(0)
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError(getErrorMessage(err, 'Failed to load profile'))
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
      setSettingsMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to update username. It may already be taken.')
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

  const handleDeleteAccount = async () => {
    if (!currentUser) return

    setSettingsLoading(true)
    setSettingsMessage(null)

    try {
      await userAPI.deleteProfile()

      // Log out and redirect to home
      await authAPI.logout()
      navigate('/')
    } catch (err) {
      console.error('Failed to delete account:', err)
      setSettingsMessage({
        type: 'error',
        text: getErrorMessage(err, 'Failed to delete account. Please try again.')
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
                  <div className="label">Votes Received</div>
                </StatItem>
                <StatItem>
                  <div className="number">{votesMade}</div>
                  <div className="label">Votes Made</div>
                </StatItem>
                <StatItem>
                  <div className="number">{commentsReceived}</div>
                  <div className="label">Comments Received</div>
                </StatItem>
                <StatItem>
                  <div className="number">{commentsMade}</div>
                  <div className="label">Comments Made</div>
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
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      maxLength={20}
                      disabled={settingsLoading}
                      placeholder="New username"
                    />
                    <PrimaryButton
                      onClick={handleUsernameUpdate}
                      disabled={settingsLoading || !newUsername.trim() || newUsername === profile.username}
                    >
                      {settingsLoading ? 'Saving...' : 'Save'}
                    </PrimaryButton>
                    <SecondaryButton
                      onClick={() => {
                        setEditingUsername(false)
                        setNewUsername('')
                        setSettingsMessage(null)
                      }}
                      disabled={settingsLoading}
                    >
                      Cancel
                    </SecondaryButton>
                  </div>
                )}
              </SettingRow>

              <SettingRow>
                <div className="setting-info">
                  <h3>Change Password</h3>
                  <p>Update your password to keep your account secure</p>
                </div>
                <PrimaryButton onClick={() => setShowChangePassword(true)}>
                  Change Password
                </PrimaryButton>
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

              <SettingRow style={{ borderColor: colors.danger }}>
                <div className="setting-info">
                  <h3 style={{ color: colors.danger }}>Delete Account</h3>
                  <p>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <PrimaryButton
                  onClick={() => setShowDeleteAccount(true)}
                  style={{ background: colors.danger }}
                  disabled={settingsLoading}
                >
                  Delete Account
                </PrimaryButton>
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
              posts.map((post) => {
                const netVotes = (post.upvotes || 0) - (post.downvotes || 0)
                const totalVotes = (post.upvotes || 0) + (post.downvotes || 0)

                return (
                  <BlogPostCard key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
                    <PostHeader>
                      <PostTitle>{post.title}</PostTitle>
                      <VoteDisplay $netVotes={netVotes}>
                        <div className="net-votes">
                          {netVotes > 0 ? '+' : ''}{netVotes}
                        </div>
                        <div className="total-votes">
                          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                        </div>
                      </VoteDisplay>
                    </PostHeader>

                    <PostMeta>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </PostMeta>

                    <PostContent>
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            const { ref, ...safeProps } = props as Record<string, unknown> & { ref?: unknown }
                            return match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...safeProps}>
                                {children}
                              </code>
                            )
                          },
                        }}
                      >
                        {post.content.length > 300
                          ? `${post.content.substring(0, 300)}...`
                          : post.content}
                      </ReactMarkdown>
                    </PostContent>

                    {post.topic_tags && (
                      <TagsContainer>
                        {post.topic_tags.split(',').map((tag, idx) => (
                          <Tag key={idx}>{tag.trim()}</Tag>
                        ))}
                      </TagsContainer>
                    )}
                  </BlogPostCard>
                )
              })
            )}
          </PostsSection>

          {/* Change Password Modal */}
          <ChangePasswordModal
            show={showChangePassword}
            onHide={() => setShowChangePassword(false)}
          />

          {/* Delete Account Modal */}
          <ConfirmModal
            show={showDeleteAccount}
            onHide={() => setShowDeleteAccount(false)}
            onConfirm={handleDeleteAccount}
            title="Delete Account"
            message="Are you sure you want to delete your account? This will permanently delete all your posts, comments, and votes. This action cannot be undone."
            confirmText="Delete Account"
            cancelText="Cancel"
            variant="danger"
          />
        </div>
      </PageContainer>
      <Footer />
    </>
  )
}

export default ProfilePage
