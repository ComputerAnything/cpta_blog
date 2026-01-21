import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../../../../contexts/AuthContext'
import { userAPI, commentAPI } from '../../../../services/api'
import type { User, BlogPost, VotedPost, CommentedPost } from '../../../../types'
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
import StyledAlert from '../../../common/StyledAlert'
import ProfileSettingsModal from '../components/ProfileSettingsModal'
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
  grid-template-columns: repeat(3, 1fr);
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

const PersonalStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${colors.borderLight};
  opacity: 0.85;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const StatButton = styled.button<{ $active?: boolean }>`
  text-align: center;
  padding: 0.75rem;
  background: ${props => props.$active ? colors.primary : colors.backgroundDark};
  border: 1px solid ${props => props.$active ? colors.primary : colors.borderLight};
  border-radius: 8px;
  transition: ${transitions.default};
  cursor: pointer;
  width: 100%;

  &:hover {
    border-color: ${colors.primary};
    transform: translateY(-2px);
  }

  .number {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${props => props.$active ? '#000' : colors.primary};
  }

  .label {
    font-size: 0.85rem;
    color: ${props => props.$active ? '#000' : colors.text.muted};
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

const SettingsButton = styled.button`
  background: transparent;
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  color: ${colors.text.muted};
  cursor: pointer;
  transition: ${transitions.default};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    border-color: ${colors.primary};
    color: ${colors.primary};
  }

  i {
    font-size: 1rem;
  }
`

const UserInfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`

const CommentPreview = styled.div`
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: ${colors.backgroundDark};
  border-left: 3px solid ${colors.primary};
  border-radius: 0 8px 8px 0;

  .comment-label {
    font-size: 0.75rem;
    color: ${colors.primary};
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .comment-content {
    color: ${colors.text.secondary};
    font-size: 0.85rem;
    line-height: 1.4;
  }
`

const VoteBadge = styled.span<{ $type: 'upvote' | 'downvote' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => props.$type === 'upvote' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'};
  color: ${props => props.$type === 'upvote' ? '#28a745' : colors.danger};
`

const PostsSection = styled.div`
  > h2 {
    color: ${colors.primary};
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
`

type ProfileView = 'my-posts' | 'votes-received' | 'comments-received' | 'votes-made' | 'comments-made'

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: currentUser, updateUser, logout } = useAuth()

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stats state
  const [votesMade, setVotesMade] = useState(0)
  const [commentsMade, setCommentsMade] = useState(0)
  const [commentsReceived, setCommentsReceived] = useState(0)

  // Interactive view state
  const [activeView, setActiveView] = useState<ProfileView>('my-posts')
  const [votedPosts, setVotedPosts] = useState<VotedPost[]>([])
  const [commentedPosts, setCommentedPosts] = useState<CommentedPost[]>([])

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      setActiveView('my-posts') // Reset view when profile changes

      try {
        // Fetch user profile
        const profileData = username
          ? await userAPI.getUserByUsername(username)
          : await userAPI.getProfile()

        setProfile(profileData)

        const targetUsername = username || currentUser?.username

        if (targetUsername) {
          // Fetch user's posts, votes, and comments in parallel
          const [postsData, votesCount, commentsCount, votedPostsData, commentedPostsData] = await Promise.all([
            userAPI.getUserPosts(targetUsername),
            userAPI.getUserVotesCount(targetUsername),
            userAPI.getUserCommentsCount(targetUsername),
            userAPI.getUserVotedPosts(targetUsername),
            userAPI.getUserCommentedPosts(targetUsername)
          ])

          setPosts(Array.isArray(postsData) ? postsData : [])
          setVotesMade(votesCount)
          setCommentsMade(commentsCount)
          setVotedPosts(Array.isArray(votedPostsData) ? votedPostsData : [])
          setCommentedPosts(Array.isArray(commentedPostsData) ? commentedPostsData : [])

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
          setVotedPosts([])
          setCommentedPosts([])
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

  // Handler for profile updates from the settings modal
  const handleProfileUpdate = (updatedUser: User) => {
    setProfile(updatedUser)
    updateUser(updatedUser)
  }

  // Handler for account deletion from the settings modal
  const handleAccountDeleted = async () => {
    // Clear user state from AuthContext (skip auto-redirect so we can show account-deleted banner)
    await logout(true)
    // Force full page reload to home with account deleted success banner
    window.location.href = '/?banner=account-deleted-success'
  }

  // Calculate total votes received on user's posts
  const votesReceived = posts.reduce((sum, post) => sum + post.upvotes + post.downvotes, 0)

  // Get posts with votes for "Votes Received" view
  const postsWithVotes = posts.filter(post => (post.upvotes + post.downvotes) > 0)

  // Get posts with comments for "Comments Received" view
  const postsWithComments = posts.filter(post => (post.comment_count ?? 0) > 0)

  // Get current view's posts
  const getDisplayPosts = (): (BlogPost | VotedPost | CommentedPost)[] => {
    switch (activeView) {
      case 'my-posts':
        return posts
      case 'votes-received':
        return postsWithVotes
      case 'comments-received':
        return postsWithComments
      case 'votes-made':
        return votedPosts
      case 'comments-made':
        return commentedPosts
      default:
        return posts
    }
  }

  // Get view title
  const getViewTitle = (): string => {
    const isOwn = !username || (currentUser && currentUser.username === username)
    switch (activeView) {
      case 'my-posts':
        return isOwn ? 'My Posts' : `@${profile?.username}'s Posts`
      case 'votes-received':
        return isOwn ? 'Posts with Votes' : `@${profile?.username}'s Posts with Votes`
      case 'comments-received':
        return isOwn ? 'Posts with Comments' : `@${profile?.username}'s Posts with Comments`
      case 'votes-made':
        return isOwn ? 'Posts I Voted On' : `Posts @${profile?.username} Voted On`
      case 'comments-made':
        return isOwn ? 'Posts I Commented On' : `Posts @${profile?.username} Commented On`
      default:
        return 'Posts'
    }
  }

  // Get empty state message
  const getEmptyMessage = (): string => {
    const isOwn = !username || (currentUser && currentUser.username === username)
    switch (activeView) {
      case 'my-posts':
        return isOwn ? "You haven't created any posts yet." : "This user hasn't created any posts yet."
      case 'votes-received':
        return isOwn ? "None of your posts have received votes yet." : "None of this user's posts have received votes yet."
      case 'comments-received':
        return isOwn ? "None of your posts have received comments yet." : "None of this user's posts have received comments yet."
      case 'votes-made':
        return isOwn ? "You haven't voted on any posts yet." : "This user hasn't voted on any posts yet."
      case 'comments-made':
        return isOwn ? "You haven't commented on any posts yet." : "This user hasn't commented on any posts yet."
      default:
        return 'No posts to display.'
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
              <UserInfoHeader>
                <div>
                  <h1>@{profile.username}</h1>
                  {isOwnProfile && profile.email && (
                    <div className="email">{profile.email}</div>
                  )}
                  <div className="joined">
                    Member since {new Date(profile.created_at || '').toLocaleDateString()}
                  </div>
                </div>
                {isOwnProfile && (
                  <SettingsButton onClick={() => setShowSettingsModal(true)}>
                    <i className="bi bi-gear"></i>
                    Settings
                  </SettingsButton>
                )}
              </UserInfoHeader>
              <Stats>
                <StatButton
                  $active={activeView === 'my-posts'}
                  onClick={() => setActiveView('my-posts')}
                >
                  <div className="number">{posts.length}</div>
                  <div className="label">Posts</div>
                </StatButton>
                <StatButton
                  $active={activeView === 'votes-received'}
                  onClick={() => setActiveView('votes-received')}
                >
                  <div className="number">{votesReceived}</div>
                  <div className="label">Votes Received</div>
                </StatButton>
                <StatButton
                  $active={activeView === 'comments-received'}
                  onClick={() => setActiveView('comments-received')}
                >
                  <div className="number">{commentsReceived}</div>
                  <div className="label">Comments Received</div>
                </StatButton>
              </Stats>
              {isOwnProfile && (
                <PersonalStats>
                  <StatButton
                    $active={activeView === 'votes-made'}
                    onClick={() => setActiveView('votes-made')}
                  >
                    <div className="number">{votesMade}</div>
                    <div className="label">Votes Made</div>
                  </StatButton>
                  <StatButton
                    $active={activeView === 'comments-made'}
                    onClick={() => setActiveView('comments-made')}
                  >
                    <div className="number">{commentsMade}</div>
                    <div className="label">Comments Made</div>
                  </StatButton>
                </PersonalStats>
              )}
            </UserInfo>
          </ProfileHeader>

          <PostsSection>
            <h2>{getViewTitle()}</h2>

            {getDisplayPosts().length === 0 ? (
              <LoadingMessage>{getEmptyMessage()}</LoadingMessage>
            ) : (
              getDisplayPosts().map((post) => {
                const netVotes = (post.upvotes || 0) - (post.downvotes || 0)
                const totalVotes = (post.upvotes || 0) + (post.downvotes || 0)
                const commentCount = post.comment_count || 0
                const isVotedPost = 'user_vote' in post
                const isCommentedPost = 'user_comment' in post

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
                      {post.author && activeView !== 'my-posts' && (
                        <>
                          <span>
                            By{' '}
                            <a
                              href={`/profile/${post.author}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                navigate(`/profile/${post.author}`)
                              }}
                            >
                              @{post.author}
                            </a>
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>
                        <i className="bi bi-chat-dots me-1"></i>
                        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                      </span>
                      {isVotedPost && (
                        <>
                          <span>•</span>
                          <VoteBadge $type={(post as VotedPost).user_vote}>
                            <i className={`bi bi-arrow-${(post as VotedPost).user_vote === 'upvote' ? 'up' : 'down'}`}></i>
                            {(post as VotedPost).user_vote === 'upvote' ? 'Upvoted' : 'Downvoted'}
                          </VoteBadge>
                        </>
                      )}
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

                    {isCommentedPost && (
                      <CommentPreview onClick={(e) => e.stopPropagation()}>
                        <div className="comment-label">Most recent comment:</div>
                        <div className="comment-content">
                          {(post as CommentedPost).user_comment.content.length > 150
                            ? `${(post as CommentedPost).user_comment.content.substring(0, 150)}...`
                            : (post as CommentedPost).user_comment.content}
                        </div>
                      </CommentPreview>
                    )}

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

          {/* Profile Settings Modal */}
          {isOwnProfile && profile && (
            <ProfileSettingsModal
              show={showSettingsModal}
              onHide={() => setShowSettingsModal(false)}
              user={profile}
              onProfileUpdate={handleProfileUpdate}
              onAccountDeleted={handleAccountDeleted}
            />
          )}
        </div>
      </PageContainer>
      <Footer />
    </>
  )
}

export default ProfilePage
