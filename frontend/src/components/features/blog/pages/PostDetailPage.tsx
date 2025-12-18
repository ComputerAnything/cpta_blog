import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../../../../contexts/AuthContext'
import { blogAPI, commentAPI } from '../../../../services/api'
import type { BlogPost, Comment } from '../../../../types'
import { getErrorMessage } from '../../../../utils/errors'
import StyledAlert from '../../../common/StyledAlert'
import { PrimaryButton, ColorButton } from '../../../common/StyledButton'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { PageContainer } from '../../../../theme/sharedComponents'
import Footer from '../../../layout/Footer'

const PostCard = styled.div`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: ${shadows.medium};

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`

const PostHeader = styled.div`
  margin-bottom: 2rem;
`

const PostTitle = styled.h1`
  color: ${colors.primary};
  font-size: 2.5rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const PostMeta = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: ${colors.text.muted};
  margin-bottom: 1rem;

  a {
    color: ${colors.primary};
    text-decoration: none;
    transition: ${transitions.default};

    &:hover {
      color: ${colors.primaryDark};
      text-decoration: underline;
    }
  }
`
const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`

const Tag = styled.span`
  background: ${colors.info}20;
  border: 1px solid ${colors.info};
  color: ${colors.info};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
`

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const VotingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  flex-wrap: wrap;
`

const VoteButton = styled.button<{ $active?: boolean; $type: 'up' | 'down' }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.$type === 'up' ? colors.success : colors.danger};
  background: ${props => props.$active
    ? props.$type === 'up' ? `${colors.success}20` : `${colors.danger}20`
    : 'transparent'
  };
  color: ${props => props.$type === 'up' ? colors.success : colors.danger};
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: ${transitions.default};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.$type === 'up' ? `${colors.success}30` : `${colors.danger}30`};
    transform: translateY(-2px);
    box-shadow: ${shadows.button};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`

const VoteStats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1rem;

  .net-votes {
    font-size: 2rem;
    font-weight: bold;
    color: ${colors.primary};
  }

  .total-votes {
    font-size: 0.9rem;
    color: ${colors.text.muted};
  }
`

const PostContent = styled.div`
  color: ${colors.text.primary};
  line-height: 1.8;
  font-size: 1.05rem;

  p {
    margin-bottom: 1.5rem;
  }

  code {
    background: ${colors.primary}20;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.95em;
  }

  pre {
    background: ${colors.backgroundDark};
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${colors.primary};
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  ul, ol {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
    color: ${colors.text.primary};
  }

  blockquote {
    border-left: 4px solid ${colors.primary};
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: ${colors.text.secondary};
  }
`

const CommentsSection = styled.div`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  h2 {
    color: #00ff41;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
  }
`

const CommentForm = styled.form`
  margin-bottom: 2rem;

  textarea {
    width: 100%;
    min-height: 100px;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    resize: vertical;
    margin-bottom: 1rem;

    &:focus {
      outline: none;
      border-color: #00ff41;
      box-shadow: 0 0 0 2px rgba(0, 255, 65, 0.2);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
`

const CommentCard = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;

  .author {
    color: #00ff41;
    font-weight: 600;
  }

  .date {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
  }
`

const CommentContent = styled.div`
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
`

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ variant: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)

  // Component unmount protection
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      if (!postId) return

      setLoading(true)
      setError(null)

      try {
        // Fetch post and comments in parallel
        const [postData, commentsData] = await Promise.all([
          blogAPI.getPost(parseInt(postId)),
          commentAPI.getComments(parseInt(postId))
        ])

        if (isMounted) {
          setPost(postData)
          setComments(Array.isArray(commentsData) ? commentsData : [])
        }
      } catch (err: unknown) {
        console.error('Failed to fetch data:', err)
        if (isMounted) {
          setError(getErrorMessage(err, 'Failed to load post'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [postId])

  const handleUpvote = async () => {
    if (!user) {
      navigate('/?login=true')
      return
    }

    if (!post) return

    try {
      const { upvotes, downvotes } = await blogAPI.upvotePost(post.id)
      setPost((prev) => prev ? ({ ...prev, upvotes, downvotes }) : prev)
      setUserVote((prev) => (prev === 'upvote' ? null : 'upvote'))
    } catch (err: unknown) {
      console.error('Upvote error:', err)
      setAlert({ variant: 'danger', message: getErrorMessage(err, 'Failed to upvote') })
    }
  }

  const handleDownvote = async () => {
    if (!user) {
      navigate('/?login=true')
      return
    }

    if (!post) return

    try {
      const { upvotes, downvotes } = await blogAPI.downvotePost(post.id)
      setPost((prev) => prev ? ({ ...prev, upvotes, downvotes }) : prev)
      setUserVote((prev) => (prev === 'downvote' ? null : 'downvote'))
    } catch (err: unknown) {
      console.error('Downvote error:', err)
      setAlert({ variant: 'danger', message: getErrorMessage(err, 'Failed to downvote') })
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      navigate('/?login=true')
      return
    }

    if (!commentContent.trim()) {
      setAlert({ variant: 'warning', message: 'Comment cannot be empty.' })
      return
    }

    setSubmitting(true)

    try {
      if (!post) return

      await commentAPI.createComment(post.id, commentContent)
      setCommentContent('')

      // Refresh comments
      const commentsData = await commentAPI.getComments(post.id)
      setComments(Array.isArray(commentsData) ? commentsData : [])
    } catch (err: unknown) {
      console.error('Comment error:', err)
      setAlert({ variant: 'danger', message: getErrorMessage(err, 'Failed to post comment') })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      if (!post) return

      await commentAPI.deleteComment(post.id, commentId)

      // Refresh comments
      const commentsData = await commentAPI.getComments(post.id)
      setComments(Array.isArray(commentsData) ? commentsData : [])
    } catch (err: unknown) {
      console.error('Delete comment error:', err)
      setAlert({ variant: 'danger', message: getErrorMessage(err, 'Failed to delete comment') })
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      if (!post) return

      await blogAPI.deletePost(post.id)
      navigate('/posts')
    } catch (err: unknown) {
      console.error('Delete post error:', err)
      setAlert({ variant: 'danger', message: getErrorMessage(err, 'Failed to delete post') })
    }
  }

  const handleEditPost = () => {
    navigate(`/posts/${postId}/edit`)
  }

  if (loading) {
    return (
      <>
        <PageContainer>
          <LoadingMessage>Loading post...</LoadingMessage>
        </PageContainer>
        <Footer />
      </>
    )
  }

  if (error || !post) {
    return (
      <>
        <PageContainer>
          <div style={{ padding: '2rem' }}>
            <StyledAlert variant="danger">{error || 'Post not found'}</StyledAlert>
          </div>
        </PageContainer>
        <Footer />
      </>
    )
  }

  const netVotes = post.upvotes - post.downvotes
  const totalVotes = post.upvotes + post.downvotes
  const isOwner = user && post.user_id === user.id

  return (
    <>
      <PageContainer>
        <div className="container">
          <PostCard>
            <PostHeader>
              <PostTitle>{post.title}</PostTitle>
              <PostMeta>
                <span>
                  By{' '}
                  {post.author ? (
                    <a
                      href={`/profile/${post.author}`}
                      onClick={(e) => {
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

              {post.topic_tags && (
                <TagsContainer>
                  {post.topic_tags.split(',').map((tag, idx) => (
                    <Tag key={idx}>{tag.trim()}</Tag>
                  ))}
                </TagsContainer>
              )}

              {isOwner && (
                <ActionButtons>
                  <ColorButton color="warning" onClick={handleEditPost}>
                    <i className="bi bi-pencil-square"></i> Edit Post
                  </ColorButton>
                  <ColorButton color="danger" onClick={handleDeletePost}>
                    <i className="bi bi-trash"></i> Delete Post
                  </ColorButton>
                </ActionButtons>
              )}
            </PostHeader>

            <VotingSection>
              <VoteButton
                $type="up"
                $active={userVote === 'upvote'}
                onClick={handleUpvote}
                disabled={!user}
              >
                <i className="bi bi-hand-thumbs-up-fill"></i>
                Upvote
              </VoteButton>

              <VoteStats>
                <div className="net-votes">{netVotes > 0 ? '+' : ''}{netVotes}</div>
                <div className="total-votes">{totalVotes} votes</div>
              </VoteStats>

              <VoteButton
                $type="down"
                $active={userVote === 'downvote'}
                onClick={handleDownvote}
                disabled={!user}
              >
                <i className="bi bi-hand-thumbs-down-fill"></i>
                Downvote
              </VoteButton>
            </VotingSection>

            <PostContent>
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { ref, ...safeProps } = props as Record<string, unknown> & { ref?: unknown }
                    const isInline = !match
                    return !isInline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as { [key: string]: React.CSSProperties }}
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
                {post.content}
              </ReactMarkdown>
            </PostContent>
          </PostCard>

          <CommentsSection>
            <h2>Comments ({comments.length})</h2>

            {user && (
              <CommentForm onSubmit={handleCommentSubmit}>
                <textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  disabled={submitting}
                />
                <PrimaryButton type="submit" disabled={submitting || !commentContent.trim()}>
                  {submitting ? 'Posting...' : 'Post Comment'}
                </PrimaryButton>
              </CommentForm>
            )}

            {!user && (
              <LoadingMessage style={{ padding: '1rem', fontSize: '1rem' }}>
                Please login to comment.
              </LoadingMessage>
            )}

            {comments.length === 0 ? (
              <LoadingMessage style={{ padding: '2rem' }}>
                No comments yet. Be the first to comment!
              </LoadingMessage>
            ) : (
              comments.map((comment) => (
                <CommentCard key={comment.id}>
                  <CommentHeader>
                    <div>
                      <span className="author">{comment.username}</span>
                      <span className="date"> • {new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    {user && comment.user_id === user.id && (
                      <ColorButton color="danger" size="sm" onClick={() => handleDeleteComment(comment.id)}>
                        <i className="bi bi-trash"></i> Delete
                      </ColorButton>
                    )}
                  </CommentHeader>
                  <CommentContent>{comment.content}</CommentContent>
                </CommentCard>
              ))
            )}
          </CommentsSection>
        </div>

        {alert && (
          <StyledAlert
            variant={alert.variant}
            dismissible
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </StyledAlert>
        )}
      </PageContainer>
      <Footer />
    </>
  )
}

export default PostDetailPage
