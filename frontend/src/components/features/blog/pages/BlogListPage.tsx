import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../../../../contexts/AuthContext'
import { blogAPI, userAPI } from '../../../../services/api'
import type { BlogPost, User } from '../../../../types'
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
  NoResults,
  LoadingMessage,
} from '../../../../theme/sharedComponents'
import { PrimaryButton } from '../../../common/StyledButton'
import StyledAlert from '../../../common/StyledAlert'
import LoginModal from '../../auth/components/LoginModal'
import RegisterModal from '../../auth/components/RegisterModal'
import Footer from '../../../layout/Footer'

const BlogListContainer = styled(PageContainer)`
  display: flex;
  padding: 0; /* Override padding since sidebar handles its own */

  @media (max-width: 991px) {
    flex-direction: column;
  }
`

const Sidebar = styled.div`
  width: 320px;
  background: ${colors.backgroundAlt};
  border-right: 1px solid ${colors.borderLight};
  padding: 1.5rem;
  position: sticky;
  top: 70px;
  height: fit-content;
  max-height: calc(100vh - 70px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.border};
    border-radius: 3px;

    &:hover {
      background: ${colors.primary};
    }
  }

  @media (max-width: 991px) {
    width: 100%;
    position: relative;
    top: 0;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid ${colors.borderLight};
  }
`

const MainPanel = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const SearchBar = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid ${colors.borderLight};
  border-radius: 10px;
  color: ${colors.text.primary};
  font-size: 0.9rem;
  transition: ${transitions.default};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    background: rgba(0, 0, 0, 0.6);
    box-shadow: ${shadows.focus};
  }

  &::placeholder {
    color: ${colors.text.muted};
  }
`

const SidebarSection = styled.div`
  margin-bottom: 1.75rem;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 0.85rem;
    color: ${colors.primary};
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '';
      width: 3px;
      height: 14px;
      background: linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
      border-radius: 2px;
    }
  }
`

const ProfileList = styled.div`
  max-height: 280px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 0.5rem;
  border: 1px solid ${colors.borderLight};
  margin-top: 0.5rem;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.border};
    border-radius: 3px;
  }
`

const ProfileItem = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: ${colors.text.secondary};
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  transition: ${transitions.fast};
  font-size: 0.9rem;

  &:hover {
    background: ${colors.hover};
    color: ${colors.primary};
  }
`

const BannerAlertWrapper = styled.div`
  width: 100%;
  margin: 0;
  padding: 0;

  .alert {
    border-radius: 0;
    border-left: none;
    border-right: none;
    margin: 0;
    text-align: center;
  }

  /* Make close button light/white on both banners */
  .btn-close {
    filter: brightness(0) invert(1);
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
`

const BlogListPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const bannerType = searchParams.get('banner')

  // State management
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blogSearch, setBlogSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')

  // Auto-dismiss success banners after 5 seconds (but NOT session-expired)
  useEffect(() => {
    if (bannerType === 'logout-success') {
      const timer = setTimeout(() => {
        setSearchParams({})
      }, 5000)
      return () => clearTimeout(timer)
    }
    // session-expired banner stays until manually dismissed (industry standard)
  }, [bannerType, setSearchParams])

  // Fetch posts on mount (only once)
  useEffect(() => {
    let isMounted = true

    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const postsData = await blogAPI.getAllPosts()

        if (isMounted) {
          setPosts(Array.isArray(postsData) ? postsData : [])
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err)
        if (isMounted) {
          setError(getErrorMessage(err, 'Failed to load blog posts'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPosts()

    return () => {
      isMounted = false
    }
  }, []) // Only run once on mount

  // Fetch users when searching (only if logged in)
  useEffect(() => {
    if (!user || !userSearch) return

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)
        // Server-side search with pagination (get up to 100 results)
        const response = await userAPI.getAllUsers(userSearch, 1, 100)
        setUsers(Array.isArray(response.users) ? response.users : [])
      } catch (err) {
        console.error('Failed to fetch users:', err)
        // Silently fail for user search - just show empty results
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    // Debounce search to avoid too many requests
    const timeoutId = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timeoutId)
  }, [userSearch, user])

  // Filter posts by title and tags (client-side)
  const filteredPosts = posts.filter((post) => {
    if (!blogSearch) return true
    const searchLower = blogSearch.toLowerCase()
    const title = post.title?.toLowerCase() || ''
    const tags = post.topic_tags?.toLowerCase() || ''
    return title.includes(searchLower) || tags.includes(searchLower)
  })

  // Users are already filtered by the server, no need for client-side filtering

  // Show loading state
  if (loading) {
    return (
      <>
        <BlogListContainer>
          <LoadingMessage>Loading posts...</LoadingMessage>
        </BlogListContainer>
        <Footer />
      </>
    )
  }

  // Show error state
  if (error) {
    return (
      <>
        <BlogListContainer>
          <div style={{ padding: '2rem' }}>
            <StyledAlert variant="danger">{error}</StyledAlert>
          </div>
        </BlogListContainer>
        <Footer />
      </>
    )
  }

  return (
    <>
      {/* Session Expired Banner - Yellow Warning */}
      {bannerType === 'session-expired' && (
        <BannerAlertWrapper>
          <StyledAlert
            variant="warning"
            dismissible
            onClose={() => setSearchParams({})}
          >
            <strong>Session Expired</strong>
            <div>Your session has expired. Please log in again to continue.</div>
          </StyledAlert>
        </BannerAlertWrapper>
      )}

      {/* Logout Success Banner - Green Success */}
      {bannerType === 'logout-success' && (
        <BannerAlertWrapper>
          <StyledAlert
            variant="success"
            dismissible
            onClose={() => setSearchParams({})}
          >
            <strong>Logged Out Successfully</strong>
            <div>You've been logged out. Come back soon!</div>
          </StyledAlert>
        </BannerAlertWrapper>
      )}

      {/* Delete Profile Success Banner - Green Success */}
      {bannerType === 'account-deleted-success' && (
        <BannerAlertWrapper>
          <StyledAlert
            variant="success"
            dismissible
            onClose={() => setSearchParams({})}
          >
            <strong>Profile Deleted Successfully</strong>
            <div>Your profile and all associated data have been deleted.</div>
          </StyledAlert>
        </BannerAlertWrapper>
      )}

      <BlogListContainer>
      <Sidebar>
        <SidebarSection>
          <h3>Quick Actions</h3>
          {user ? (
            <>
              <PrimaryButton
                onClick={() => navigate(`/profile/${user.username}`)}
                style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}
              >
                <i className="bi bi-person-circle"></i>
                My Profile
              </PrimaryButton>
              <PrimaryButton
                onClick={() => navigate('/create-post')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}
              >
                <i className="bi bi-plus-circle"></i>
                Create Post
              </PrimaryButton>
            </>
          ) : (
            <>
              <PrimaryButton
                onClick={() => navigate('/?login=true')}
                style={{ width: '100%', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}
              >
                <i className="bi bi-box-arrow-in-right"></i>
                Login
              </PrimaryButton>
              <PrimaryButton
                onClick={() => navigate('/?register=true')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}
              >
                <i className="bi bi-person-plus"></i>
                Register
              </PrimaryButton>
            </>
          )}
        </SidebarSection>

        <SidebarSection>
          <h3>Search Posts</h3>
          <SearchBar
            type="text"
            placeholder="Search by title or tags..."
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
          />
        </SidebarSection>

        {user && (
          <SidebarSection>
            <h3>Find Users</h3>
            <SearchBar
              type="text"
              placeholder="Search usernames..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            {userSearch && (
              <ProfileList>
                {loadingUsers ? (
                  <div style={{ padding: '1rem', color: colors.text.muted, textAlign: 'center' }}>
                    Loading users...
                  </div>
                ) : users.length > 0 ? (
                  users.map((u) => (
                    <ProfileItem
                      key={u.id}
                      onClick={() => {
                        navigate(`/profile/${u.username}`)
                        setUserSearch('')
                      }}
                    >
                      @{u.username}
                    </ProfileItem>
                  ))
                ) : (
                  <div style={{ padding: '1rem', color: colors.text.muted, textAlign: 'center' }}>
                    No users found
                  </div>
                )}
              </ProfileList>
            )}
          </SidebarSection>
        )}
      </Sidebar>

      <MainPanel>
        {filteredPosts.length === 0 ? (
          <NoResults>
            {blogSearch ? 'No posts match your search.' : 'No posts available yet. Be the first to create one!'}
          </NoResults>
        ) : (
          filteredPosts.map((post) => {
            const netVotes = (post.upvotes || 0) - (post.downvotes || 0)
            const totalVotes = (post.upvotes || 0) + (post.downvotes || 0)

            return (
              <BlogPostCard
                key={post.id}
                onClick={() => navigate(`/posts/${post.id}`)}
              >
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
                  <span>
                    By{' '}
                    {post.author ? (
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
                    ) : (
                      <span>@Unknown</span>
                    )}
                  </span>
                  <span>•</span>
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
      </MainPanel>

      {/* Auth Modals */}
      <LoginModal />
      <RegisterModal />
      </BlogListContainer>

      {/* Footer */}
      <Footer />
    </>
  )
}

export default BlogListPage
