import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuth } from '../../../../contexts/AuthContext'
import { userAPI } from '../../../../services/api'
import type { User, BlogPost } from '../../../../types'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { PageContainer } from '../../../../theme/sharedComponents'
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

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid ${colors.danger};
  color: ${colors.danger};
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`

const ProfilePage = () => {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState<User | null>(null)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [username, currentUser])

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
          <ErrorMessage>{error || 'Profile not found'}</ErrorMessage>
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
