import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAppSelector } from '../../redux/hooks'
import API from '../../services/api'
import type { User, BlogPost } from '../../types'

const ProfileContainer = styled.div`
  min-height: calc(100vh - 180px);
  background: #000;
  color: white;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const ProfileHeader = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(0, 255, 65, 0.2);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #000;
  font-weight: 700;
  flex-shrink: 0;
`

const UserInfo = styled.div`
  flex: 1;

  h1 {
    color: #00ff41;
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .email {
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 1rem;
  }

  .joined {
    color: rgba(255, 255, 255, 0.5);
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
    color: #00ff41;
  }

  .label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
  }
`

const PostsSection = styled.div`
  h2 {
    color: #00ff41;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
`

const PostCard = styled.div`
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

  h3 {
    color: #00ff41;
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  .post-meta {
    display: flex;
    gap: 1rem;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .post-content {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .tag {
    background: rgba(0, 123, 255, 0.2);
    border: 1px solid rgba(0, 123, 255, 0.5);
    color: #4d9fff;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
  }
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
`

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: #ff6b6b;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAppSelector((state) => state.auth)

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
        const profileResponse = userId
          ? await API.get(`/users/${userId}`)
          : await API.get('/profile')

        setProfile(profileResponse.data)

        // Fetch user's posts
        const postsResponse = userId
          ? await API.get(`/users/${userId}/posts`)
          : await API.get(`/users/${currentUser?.id}/posts`)

        setPosts(postsResponse.data)
      } catch (err: any) {
        setError(err.response?.data?.msg || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, currentUser])

  if (loading) {
    return (
      <ProfileContainer>
        <LoadingMessage>Loading profile...</LoadingMessage>
      </ProfileContainer>
    )
  }

  if (error || !profile) {
    return (
      <ProfileContainer>
        <ErrorMessage>{error || 'Profile not found'}</ErrorMessage>
      </ProfileContainer>
    )
  }

  const isOwnProfile = !userId || (currentUser && currentUser.id === parseInt(userId))

  return (
    <ProfileContainer>
      <div className="container">
        <ProfileHeader>
          <Avatar>{profile.username.charAt(0).toUpperCase()}</Avatar>
          <UserInfo>
            <h1>{profile.username}</h1>
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
          <h2>{isOwnProfile ? 'My Posts' : `${profile.username}'s Posts`}</h2>

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
    </ProfileContainer>
  )
}

export default Profile
