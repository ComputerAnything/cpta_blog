import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { fetchPosts, fetchProfiles } from '../../redux/slices/blogSlice'
import { logout } from '../../redux/slices/authSlice'

const BlogListContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 180px);
  background: #000;
  color: white;

  @media (max-width: 991px) {
    flex-direction: column;
  }
`

const Sidebar = styled.div`
  width: 300px;
  background: rgba(20, 20, 20, 0.95);
  border-right: 1px solid rgba(0, 255, 65, 0.2);
  padding: 2rem 1.5rem;
  position: sticky;
  top: 70px;
  height: fit-content;
  max-height: calc(100vh - 180px);
  overflow-y: auto;

  @media (max-width: 991px) {
    width: 100%;
    position: relative;
    top: 0;
    max-height: none;
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
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #00ff41;
    box-shadow: 0 0 0 2px rgba(0, 255, 65, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const SidebarSection = styled.div`
  margin-bottom: 2rem;

  h3 {
    font-size: 1rem;
    color: #00ff41;
    margin-bottom: 1rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`

const ActionButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.75rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  &.danger {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: white;

    &:hover {
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }
  }

  &.warning {
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    color: #000;

    &:hover {
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    }
  }
`

const ProfileList = styled.div`
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #00ff41;
    border-radius: 3px;
  }
`

const ProfileItem = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;

  &:hover {
    background: rgba(0, 255, 65, 0.1);
    border-color: #00ff41;
  }
`

const BlogPostCard = styled.div`
  background: rgba(20, 20, 20, 0.8);
  border: 1px solid rgba(0, 255, 65, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: #00ff41;
    box-shadow: 0 4px 20px rgba(0, 255, 65, 0.2);
    transform: translateY(-2px);
  }
`

const PostHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`

const PostTitle = styled.h2`
  font-size: 1.5rem;
  color: #00ff41;
  margin: 0;
  flex: 1;
`

const VoteDisplay = styled.div<{ $netVotes: number }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  min-width: 80px;

  .net-votes {
    font-size: 1.5rem;
    font-weight: bold;
    color: ${props => {
      if (props.$netVotes === 0) return '#888'
      return props.$netVotes > 0 ? '#00ff41' : '#ff4444'
    }};
  }

  .total-votes {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.25rem;
  }
`

const PostMeta = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;

  a {
    color: #00ff41;
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: #00cc33;
      text-decoration: underline;
    }
  }
`

const PostContent = styled.div`
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 1rem;

  p {
    margin-bottom: 1rem;
  }

  code {
    background: rgba(0, 255, 65, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  pre {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }
`

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Tag = styled.span`
  background: rgba(0, 123, 255, 0.2);
  border: 1px solid rgba(0, 123, 255, 0.5);
  color: #4d9fff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
`

const NoResults = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
`

const BlogList: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { posts, profiles, loading, error } = useAppSelector((state) => state.blog)
  const { user, isGuest } = useAppSelector((state) => state.auth)

  const [blogSearch, setBlogSearch] = useState('')
  const [profileSearch, setProfileSearch] = useState('')
  const [showProfiles, setShowProfiles] = useState(false)

  useEffect(() => {
    dispatch(fetchPosts())
    dispatch(fetchProfiles())
  }, [dispatch])

  const handleLogout = () => {
    dispatch(logout())
    localStorage.clear()
    navigate('/')
  }

  const handleProfile = () => {
    if (isGuest) {
      alert('Guests cannot view profiles. Please create an account.')
      return
    }
    navigate('/profile')
  }

  const handleCreatePost = () => {
    if (isGuest) {
      alert('Guests cannot create posts. Please create an account.')
      return
    }
    navigate('/create-post')
  }

  // Filter posts by topic tags
  const filteredPosts = posts.filter((post) => {
    if (!blogSearch) return true
    const tags = post.topic_tags?.toLowerCase() || ''
    return tags.includes(blogSearch.toLowerCase())
  })

  // Filter profiles by username
  const filteredProfiles = profiles.filter((profile) => {
    if (!profileSearch) return true
    return profile.username.toLowerCase().includes(profileSearch.toLowerCase())
  })

  // Calculate color scale for votes
  const calculateScaleColor = (upvotes: number, downvotes: number) => {
    const totalVotes = upvotes + downvotes
    if (totalVotes === 0) return '#888'

    const upvoteRatio = upvotes / totalVotes
    const downvoteRatio = downvotes / totalVotes

    const red = Math.round(255 * downvoteRatio)
    const green = Math.round(255 * upvoteRatio)

    return `rgb(${red}, ${green}, 0)`
  }

  return (
    <BlogListContainer>
      <Sidebar>
        <SidebarSection>
          <h3>Actions</h3>
          <ActionButton onClick={handleProfile}>My Profile</ActionButton>
          <ActionButton onClick={handleCreatePost}>Create New Post</ActionButton>
          {isGuest ? (
            <ActionButton className="warning" onClick={handleLogout}>
              Exit Guest Mode
            </ActionButton>
          ) : (
            <ActionButton className="danger" onClick={handleLogout}>
              Logout
            </ActionButton>
          )}
        </SidebarSection>

        <SidebarSection>
          <h3>Search Posts</h3>
          <SearchBar
            type="text"
            placeholder="Search by tags..."
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
          />
        </SidebarSection>

        <SidebarSection>
          <h3>Find Users</h3>
          <SearchBar
            type="text"
            placeholder="Search usernames..."
            value={profileSearch}
            onChange={(e) => {
              setProfileSearch(e.target.value)
              setShowProfiles(true)
            }}
            onFocus={() => setShowProfiles(true)}
          />
          {showProfiles && profileSearch && (
            <ProfileList>
              {filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile) => (
                  <ProfileItem
                    key={profile.id}
                    onClick={() => {
                      navigate(`/profile/${profile.id}`)
                      setShowProfiles(false)
                    }}
                  >
                    {profile.username}
                  </ProfileItem>
                ))
              ) : (
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', padding: '1rem' }}>
                  No users found
                </div>
              )}
            </ProfileList>
          )}
        </SidebarSection>
      </Sidebar>

      <MainPanel>
        {loading && <NoResults>Loading posts...</NoResults>}
        {error && <NoResults>Error: {error}</NoResults>}

        {!loading && !error && filteredPosts.length === 0 && (
          <NoResults>
            {blogSearch ? 'No posts found matching your search.' : 'No posts yet. Be the first to create one!'}
          </NoResults>
        )}

        {!loading && !error && filteredPosts.map((post) => {
          const netVotes = post.upvotes - post.downvotes
          const totalVotes = post.upvotes + post.downvotes

          return (
            <BlogPostCard key={post.id} onClick={() => navigate(`/posts/${post.id}`)}>
              <PostHeader>
                <PostTitle>{post.title}</PostTitle>
                <VoteDisplay $netVotes={netVotes}>
                  <div className="net-votes" style={{ color: calculateScaleColor(post.upvotes, post.downvotes) }}>
                    {netVotes > 0 ? '+' : ''}{netVotes}
                  </div>
                  <div className="total-votes">{totalVotes} votes</div>
                </VoteDisplay>
              </PostHeader>

              <PostMeta>
                <span>By <a href={`/profile/${post.user_id}`} onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/profile/${post.user_id}`)
                }}>{post.author || 'Unknown'}</a></span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </PostMeta>

              <PostContent>
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {`${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}`}
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
        })}
      </MainPanel>
    </BlogListContainer>
  )
}

export default BlogList
