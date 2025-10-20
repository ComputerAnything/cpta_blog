import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAppSelector } from '../../redux/hooks'
import API from '../../services/api'
import type { BlogPost, Comment } from '../../types'
import Toast from '../common/Toast'

const PostDetailContainer = styled.div`
  min-height: calc(100vh - 180px);
  background: #000;
  color: white;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const PostCard = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(0, 255, 65, 0.2);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`

const PostHeader = styled.div`
  margin-bottom: 2rem;
`

const PostTitle = styled.h1`
  color: #00ff41;
  font-size: 2.5rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

const PostMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
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

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`

const Tag = styled.span`
  background: rgba(0, 123, 255, 0.2);
  border: 1px solid rgba(0, 123, 255, 0.5);
  color: #4d9fff;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
`

const ActionButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;

  &.edit {
    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
    color: #000;

    &:hover {
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
      transform: translateY(-1px);
    }
  }

  &.delete {
    background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
    color: white;

    &:hover {
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      transform: translateY(-1px);
    }
  }
`

const VotingSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  flex-wrap: wrap;
`

const VoteButton = styled.button<{ $active?: boolean; $type: 'up' | 'down' }>`
  padding: 0.75rem 1.5rem;
  border: 2px solid ${props => props.$type === 'up' ? '#00ff41' : '#ff4444'};
  background: ${props => props.$active
    ? props.$type === 'up' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 68, 68, 0.2)'
    : 'transparent'
  };
  color: ${props => props.$type === 'up' ? '#00ff41' : '#ff4444'};
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.$type === 'up' ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 68, 68, 0.3)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.$type === 'up' ? 'rgba(0, 255, 65, 0.3)' : 'rgba(255, 68, 68, 0.3)'};
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
    color: #00ff41;
  }

  .total-votes {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
  }
`

const PostContent = styled.div`
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  font-size: 1.05rem;

  p {
    margin-bottom: 1.5rem;
  }

  code {
    background: rgba(0, 255, 65, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.95em;
  }

  pre {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #00ff41;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }

  ul, ol {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
  }

  blockquote {
    border-left: 4px solid #00ff41;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: rgba(255, 255, 255, 0.7);
  }
`

const CommentsSection = styled.div`
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(0, 255, 65, 0.2);
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

  button {
    padding: 0.75rem 2rem;
    background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
    border: none;
    border-radius: 8px;
    color: #000;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 255, 65, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      &:hover {
        transform: none;
        box-shadow: none;
      }
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

const DeleteCommentButton = styled.button`
  padding: 0.5rem 1rem;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.5);
  border-radius: 6px;
  color: #ff6b6b;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(220, 53, 69, 0.3);
    transform: translateY(-1px);
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

const ErrorMessage = styled.div`
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.5);
  color: #ff6b6b;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
`

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user, isGuest } = useAppSelector((state) => state.auth)

  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null)

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [postId])

  const fetchPost = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await API.get(`/posts/${postId}`)
      setPost(response.data)
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await API.get(`/posts/${postId}/comments`)
      setComments(response.data)
    } catch (err: any) {
      console.error('Failed to load comments:', err)
    }
  }

  const handleUpvote = async () => {
    if (isGuest) {
      setToastMessage('Guests cannot vote. Please create an account.')
      return
    }

    if (!user) {
      setToastMessage('Please login to vote.')
      return
    }

    try {
      const response = await API.post(`/posts/${postId}/upvote`)
      if (post) {
        setPost({
          ...post,
          upvotes: response.data.upvotes,
          downvotes: response.data.downvotes,
        })
        setUserVote(userVote === 'upvote' ? null : 'upvote')
      }
    } catch (err: any) {
      setToastMessage(err.response?.data?.msg || 'Failed to upvote')
    }
  }

  const handleDownvote = async () => {
    if (isGuest) {
      setToastMessage('Guests cannot vote. Please create an account.')
      return
    }

    if (!user) {
      setToastMessage('Please login to vote.')
      return
    }

    try {
      const response = await API.post(`/posts/${postId}/downvote`)
      if (post) {
        setPost({
          ...post,
          upvotes: response.data.upvotes,
          downvotes: response.data.downvotes,
        })
        setUserVote(userVote === 'downvote' ? null : 'downvote')
      }
    } catch (err: any) {
      setToastMessage(err.response?.data?.msg || 'Failed to downvote')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isGuest) {
      setToastMessage('Guests cannot comment. Please create an account.')
      return
    }

    if (!user) {
      setToastMessage('Please login to comment.')
      return
    }

    if (!commentContent.trim()) {
      setToastMessage('Comment cannot be empty.')
      return
    }

    setSubmitting(true)

    try {
      await API.post(`/posts/${postId}/comments`, {
        content: commentContent,
      })
      setCommentContent('')
      fetchComments()
    } catch (err: any) {
      setToastMessage(err.response?.data?.msg || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await API.delete(`/posts/${postId}/comments/${commentId}`)
      fetchComments()
    } catch (err: any) {
      setToastMessage(err.response?.data?.msg || 'Failed to delete comment')
    }
  }

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      await API.delete(`/posts/${postId}`)
      navigate('/posts')
    } catch (err: any) {
      setToastMessage(err.response?.data?.msg || 'Failed to delete post')
    }
  }

  const handleEditPost = () => {
    navigate(`/posts/${postId}/edit`)
  }

  if (loading) {
    return (
      <PostDetailContainer>
        <LoadingMessage>Loading post...</LoadingMessage>
      </PostDetailContainer>
    )
  }

  if (error || !post) {
    return (
      <PostDetailContainer>
        <ErrorMessage>{error || 'Post not found'}</ErrorMessage>
      </PostDetailContainer>
    )
  }

  const netVotes = post.upvotes - post.downvotes
  const totalVotes = post.upvotes + post.downvotes
  const isOwner = user && post.user_id === user.id

  return (
    <PostDetailContainer>
      <div className="container">
        <PostCard>
          <PostHeader>
            <PostTitle>{post.title}</PostTitle>
            <PostMeta>
              <span>
                By{' '}
                <a
                  href={`/profile/${post.user_id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(`/profile/${post.user_id}`)
                  }}
                >
                  @{post.author || 'Unknown'}
                </a>
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
                <ActionButton className="edit" onClick={handleEditPost}>
                  <i className="bi bi-pencil-square"></i> Edit Post
                </ActionButton>
                <ActionButton className="delete" onClick={handleDeletePost}>
                  <i className="bi bi-trash"></i> Delete Post
                </ActionButton>
              </ActionButtons>
            )}
          </PostHeader>

          <VotingSection>
            <VoteButton
              $type="up"
              $active={userVote === 'upvote'}
              onClick={handleUpvote}
              disabled={!user || isGuest}
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
              disabled={!user || isGuest}
            >
              <i className="bi bi-hand-thumbs-down-fill"></i>
              Downvote
            </VoteButton>
          </VotingSection>

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
              {post.content}
            </ReactMarkdown>
          </PostContent>
        </PostCard>

        <CommentsSection>
          <h2>Comments ({comments.length})</h2>

          {user && !isGuest && (
            <CommentForm onSubmit={handleCommentSubmit}>
              <textarea
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                disabled={submitting}
              />
              <button type="submit" disabled={submitting || !commentContent.trim()}>
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </CommentForm>
          )}

          {isGuest && (
            <LoadingMessage style={{ padding: '1rem', fontSize: '1rem' }}>
              Guests cannot comment. Please create an account to participate.
            </LoadingMessage>
          )}

          {!user && !isGuest && (
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
                    <DeleteCommentButton onClick={() => handleDeleteComment(comment.id)}>
                      <i className="bi bi-trash"></i> Delete
                    </DeleteCommentButton>
                  )}
                </CommentHeader>
                <CommentContent>{comment.content}</CommentContent>
              </CommentCard>
            ))
          )}
        </CommentsSection>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </PostDetailContainer>
  )
}

export default PostDetail
