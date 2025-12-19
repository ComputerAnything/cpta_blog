import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAuth } from '../../../../contexts/AuthContext'
import { blogAPI } from '../../../../services/api'
import { getErrorMessage } from '../../../../utils/errors'
import StyledAlert from '../../../common/StyledAlert'
import { PrimaryButton, SecondaryButton } from '../../../common/StyledButton'
import Footer from '../../../layout/Footer'
import { colors, shadows, transitions } from '../../../../theme/colors'
import { PageContainer, PostContent } from '../../../../theme/sharedComponents'

const PostForm = styled.form`
  background: ${colors.backgroundAlt};
  border: 1px solid ${colors.borderLight};
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  box-shadow: ${shadows.large};

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
    color: ${colors.text.muted};
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
    box-shadow: 0 0 0 3px ${colors.primary}20;
  }

  &::placeholder {
    color: ${colors.text.muted};
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
    box-shadow: 0 0 0 3px ${colors.primary}20;
  }

  &::placeholder {
    color: ${colors.text.muted};
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
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  h3 {
    color: #00ff41;
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .guide-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.75rem;
  }

  .guide-item {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;

    code {
      background: rgba(0, 255, 65, 0.1);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #00ff41;
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
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.primary};
    border-radius: 4px;
  }

  .empty-preview {
    color: ${colors.text.muted};
    text-align: center;
    padding: 3rem 1rem;
    font-style: italic;
  }
`

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topicTags, setTopicTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ variant: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Validation limits
  const TITLE_MAX = 200
  const CONTENT_MAX = 10000
  const TAG_MAX = 8
  const TAG_CHAR_MAX = 30

  const tagCount = topicTags ? topicTags.split(',').filter(t => t.trim()).length : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setAlert({ variant: 'warning', message: 'Please login to create a post.' })
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
      const post = await blogAPI.createPost(
        title.trim(),
        content.trim(),
        topicTags.trim() || undefined
      )

      // Navigate to the newly created post
      navigate(`/posts/${post.id}`)
    } catch (error) {
      setAlert({ variant: 'danger', message: getErrorMessage(error, 'Failed to create post') })
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (title || content || topicTags) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate('/posts')
  }

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      navigate('/?login=true')
    }
  }, [user, navigate])

  if (!user) {
    return null
  }

  return (
    <>
      <PageContainer>
        <div className="container">
          <PostForm onSubmit={handleSubmit}>
            <h1>Create New Post</h1>

            <FormGroup>
              <label htmlFor="title">
                <span>Title</span>
                <span style={{ color: title.length > TITLE_MAX ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', fontWeight: 'normal' }}>
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
                style={{ borderColor: title.length > TITLE_MAX ? '#ff4444' : undefined }}
              />
            </FormGroup>

            <FormGroup>
              <label htmlFor="tags">
                <span>Topic Tags (optional)</span>
                <span style={{ color: tagCount > TAG_MAX ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', fontWeight: 'normal' }}>
                  {tagCount}/{TAG_MAX} tags
                </span>
              </label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g. react, typescript, web-development"
                value={topicTags}
                onChange={(e) => setTopicTags(e.target.value.toLowerCase().replace(/[^a-z0-9, -]/g, ''))}
                style={{ borderColor: tagCount > TAG_MAX ? '#ff4444' : undefined }}
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
                  <span style={{ color: content.length > CONTENT_MAX ? '#ff4444' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', fontWeight: 'normal' }}>
                    {content.length.toLocaleString()}/{CONTENT_MAX.toLocaleString()}
                  </span>
                  <PreviewToggleButton
                    type="button"
                    className="preview-toggle"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <i className={`bi bi-eye${showPreview ? '-fill' : ''}`}></i>
                    <span className="preview-text"> {showPreview ? 'Hide' : 'Show'} Preview</span>
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
                  style={{ borderColor: content.length > CONTENT_MAX ? '#ff4444' : undefined }}
                />
                {showPreview && (
                  <PreviewPane>
                    {content ? (
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
                          {content}
                        </ReactMarkdown>
                      </PostContent>
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
                {submitting ? 'Creating Post...' : 'Create Post'}
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

export default CreatePostPage
