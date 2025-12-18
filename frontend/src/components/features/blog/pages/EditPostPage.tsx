import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../../../../contexts/AuthContext'
import { blogAPI } from '../../../../services/api'
import type { BlogPost } from '../../../../types'
import StyledAlert from '../../../common/StyledAlert'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { PageContainer } from '../../../../theme/sharedComponents'
import Footer from '../../../layout/Footer'

const PostForm = styled.form`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  box-shadow: ${shadows.medium};
  transition: ${transitions.default};

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  h1 {
    color: ${colors.primary};
    margin-bottom: 2rem;
    font-size: 2rem;
  }
`

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${colors.primary};
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  .helper-text {
    color: ${colors.text.secondary};
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  color: ${colors.text.primary};
  font-size: 1rem;
  transition: ${transitions.default};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.focus};
  }

  &::placeholder {
    color: ${colors.text.secondary};
  }
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  color: ${colors.text.primary};
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  resize: vertical;
  transition: ${transitions.default};

  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px ${colors.focus};
  }

  &::placeholder {
    color: ${colors.text.secondary};
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    flex-direction: column;
  }

  button {
    flex: 1;
    padding: 1rem 2rem;
    font-size: 1.1rem;

    @media (max-width: 576px) {
      width: 100%;
    }
  }
`

const MarkdownGuide = styled.div`
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h3 {
    color: ${colors.primary};
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .guide-item {
    color: ${colors.text.secondary};
    font-size: 0.85rem;

    code {
      background: ${colors.focus};
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: ${colors.primary};
    }
  }
`

const PreviewToggleButton = styled(SecondaryButton)`
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  flex: none;
`

const ContentEditor = styled.div<{ $showPreview: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.$showPreview ? '1fr 1fr' : '1fr'};
  gap: 1rem;

  @media (max-width: 991px) {
    grid-template-columns: 1fr;
  }
`

const PreviewPane = styled.div`
  background: ${colors.backgroundDark};
  border: 1px solid ${colors.borderLight};
  border-radius: 8px;
  padding: 1rem;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${colors.backgroundDark};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.primary};
    border-radius: 4px;
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${colors.primary};
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  p {
    color: ${colors.text.primary};
    line-height: 1.8;
    margin-bottom: 1rem;
  }

  code {
    background: ${colors.focus};
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

  .empty-preview {
    color: ${colors.text.secondary};
    text-align: center;
    padding: 3rem 1rem;
    font-style: italic;
  }
`

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${colors.text.secondary};
  font-size: 1.1rem;
`

const EditPostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post, setPost] = useState<BlogPost | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topicTags, setTopicTags] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ variant: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Validation limits
  const TITLE_MAX = 200
  const CONTENT_MAX = 10000
  const TAG_MAX = 8
  const TAG_CHAR_MAX = 30

  const tagCount = topicTags ? topicTags.split(',').filter(t => t.trim()).length : 0

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    setLoading(true)
    setError(null)

    try {
      if (!postId) {
        setError('Post ID is required')
        return
      }
      const postData = await blogAPI.getPost(parseInt(postId))
      setPost(postData)
      setTitle(postData.title)
      setContent(postData.content)
      setTopicTags(postData.topic_tags || '')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load post'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setAlert({ variant: 'warning', message: 'Please login to edit a post.' })
      return
    }

    if (!title.trim() || !content.trim()) {
      setAlert({ variant: 'warning', message: 'Title and content are required.' })
      return
    }

    // Frontend validation
    if (title.length > TITLE_MAX) {
      setAlert({ variant: 'warning', message: `Title must be ${TITLE_MAX} characters or less.` })
      return
    }

    if (content.length > CONTENT_MAX) {
      setAlert({ variant: 'warning', message: `Content must be ${CONTENT_MAX.toLocaleString()} characters or less.` })
      return
    }

    if (tagCount > TAG_MAX) {
      setAlert({ variant: 'warning', message: `Maximum ${TAG_MAX} tags allowed.` })
      return
    }

    setSubmitting(true)

    try {
      if (!postId || !post) {
        setAlert({ variant: 'danger', message: 'Post ID is required' })
        return
      }
      await blogAPI.updatePost(
        parseInt(postId),
        title.trim(),
        content.trim(),
        topicTags.trim() || undefined
      )

      // Navigate back to the post detail page
      navigate(`/posts/${postId}`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post'
      setAlert({ variant: 'danger', message: errorMessage })
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (
      title !== (post?.title || '') ||
      content !== (post?.content || '') ||
      topicTags !== (post?.topic_tags || '')
    ) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate(`/posts/${postId}`)
  }

  // Redirect if not authenticated or not the owner
  useEffect(() => {
    if (!user) {
      navigate('/posts')
    } else if (post && user && post.user_id !== user.id) {
      setAlert({ variant: 'danger', message: 'You are not authorized to edit this post.' })
      setTimeout(() => navigate(`/posts/${postId}`), 3000)
    }
  }, [user, post, navigate, postId])

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
          <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
            <StyledAlert variant="danger">{error || 'Post not found'}</StyledAlert>
          </div>
        </PageContainer>
        <Footer />
      </>
    )
  }

  if (!user || post.user_id !== user.id) {
    return null
  }

  return (
    <>
      <PageContainer>
        <div className="container">
          <PostForm onSubmit={handleSubmit}>
            <h1>Edit Post</h1>

            <FormGroup>
              <label htmlFor="title">
                <span>Title</span>
                <span style={{ color: title.length > TITLE_MAX ? colors.danger : colors.text.secondary, fontSize: '0.85rem', fontWeight: 'normal' }}>
                  {title.length}/{TITLE_MAX}
                </span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                required
                style={{ borderColor: title.length > TITLE_MAX ? colors.danger : undefined }}
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="tags">
                <span>Topic Tags (optional)</span>
                <span style={{ color: tagCount > TAG_MAX ? colors.danger : colors.text.secondary, fontSize: '0.85rem', fontWeight: 'normal' }}>
                  {tagCount}/{TAG_MAX} tags
                </span>
              </label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g. react, typescript, web-development"
                value={topicTags}
                onChange={(e) => setTopicTags(e.target.value.toLowerCase().replace(/[^a-z0-9, -]/g, ''))}
                style={{ borderColor: tagCount > TAG_MAX ? colors.danger : undefined }}
              />
              <div className="helper-text">
                Separate with commas. Max {TAG_MAX} tags, {TAG_CHAR_MAX} chars each. Lowercase, numbers, hyphens only.
              </div>
            </FormGroup>

            <MarkdownGuide>
              <h3>Markdown Formatting Guide</h3>
              <div className="guide-grid">
                <div className="guide-item">
                  <code># Heading</code> - Large heading
                </div>
                <div className="guide-item">
                  <code>**bold**</code> - Bold text
                </div>
                <div className="guide-item">
                  <code>*italic*</code> - Italic text
                </div>
                <div className="guide-item">
                  <code>`code`</code> - Inline code
                </div>
                <div className="guide-item">
                  <code>```language```</code> - Code block
                </div>
                <div className="guide-item">
                  <code>[link](url)</code> - Hyperlink
                </div>
                <div className="guide-item">
                  <code>- item</code> - Bullet list
                </div>
                <div className="guide-item">
                  <code>&gt; quote</code> - Blockquote
                </div>
              </div>
            </MarkdownGuide>

            <FormGroup>
              <label htmlFor="content">
                <span>Content</span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: content.length > CONTENT_MAX ? colors.danger : colors.text.secondary, fontSize: '0.85rem', fontWeight: 'normal' }}>
                    {content.length.toLocaleString()}/{CONTENT_MAX.toLocaleString()}
                  </span>
                  <PreviewToggleButton
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <i className={`bi bi-eye${showPreview ? '-fill' : ''}`}></i> {showPreview ? 'Hide' : 'Show'} Preview
                  </PreviewToggleButton>
                </div>
              </label>
              <ContentEditor $showPreview={showPreview}>
                <TextArea
                  id="content"
                  placeholder="Write your post content here... (Markdown supported)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={CONTENT_MAX}
                  required
                  style={{ borderColor: content.length > CONTENT_MAX ? colors.danger : undefined }}
                />
                {showPreview && (
                  <PreviewPane>
                    {content ? (
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
                        {content}
                      </ReactMarkdown>
                    ) : (
                      <div className="empty-preview">
                        Preview will appear here as you type...
                      </div>
                    )}
                  </PreviewPane>
                )}
              </ContentEditor>
              <div className="helper-text">
                Use Markdown syntax for formatting. Code blocks support syntax highlighting.
              </div>
            </FormGroup>

            <ButtonGroup>
              <PrimaryButton type="submit" disabled={submitting || !title.trim() || !content.trim()}>
                {submitting ? 'Updating Post...' : 'Update Post'}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={handleCancel} disabled={submitting}>
                Cancel
              </SecondaryButton>
            </ButtonGroup>
          </PostForm>
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

export default EditPostPage
