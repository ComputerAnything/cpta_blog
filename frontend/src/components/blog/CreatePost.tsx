import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useAppSelector } from '../../redux/hooks'
import API from '../../services/api'
import Toast from '../common/Toast'

const CreatePostContainer = styled.div`
  min-height: calc(100vh - 180px);
  background: #000;
  color: white;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

const PostForm = styled.form`
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(0, 255, 65, 0.2);
  border-radius: 12px;
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  h1 {
    color: #00ff41;
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
    color: #00ff41;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  .helper-text {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
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

const TextArea = styled.textarea`
  width: 100%;
  min-height: 400px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
  resize: vertical;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    flex-direction: column;
  }
`

const SubmitButton = styled.button`
  flex: 1;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #00ff41 0%, #00cc33 100%);
  border: none;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  font-size: 1.1rem;
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

  @media (max-width: 576px) {
    width: 100%;
  }
`

const CancelButton = styled.button`
  flex: 1;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  @media (max-width: 576px) {
    width: 100%;
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

const PreviewToggle = styled.button`
  background: rgba(0, 255, 65, 0.1);
  border: 1px solid rgba(0, 255, 65, 0.3);
  color: #00ff41;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 65, 0.2);
    border-color: #00ff41;
  }

  &.active {
    background: rgba(0, 255, 65, 0.2);
    border-color: #00ff41;
  }
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
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
    background: #00ff41;
    border-radius: 4px;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #00ff41;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.8;
    margin-bottom: 1rem;
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

  ul, ol {
    margin-bottom: 1.5rem;
    padding-left: 2rem;
    color: rgba(255, 255, 255, 0.9);
  }

  blockquote {
    border-left: 4px solid #00ff41;
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: rgba(255, 255, 255, 0.7);
  }

  .empty-preview {
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
    padding: 3rem 1rem;
    font-style: italic;
  }
`

const CreatePost: React.FC = () => {
  const navigate = useNavigate()
  const { user, isGuest } = useAppSelector((state) => state.auth)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [topicTags, setTopicTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Validation limits
  const TITLE_MAX = 200
  const CONTENT_MAX = 10000
  const TAG_MAX = 8
  const TAG_CHAR_MAX = 30

  const tagCount = topicTags ? topicTags.split(',').filter(t => t.trim()).length : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isGuest) {
      setToastMessage('Guests cannot create posts. Please create an account.')
      return
    }

    if (!user) {
      setToastMessage('Please login to create a post.')
      return
    }

    if (!title.trim() || !content.trim()) {
      setToastMessage('Title and content are required.')
      return
    }

    // Frontend validation
    if (title.length > TITLE_MAX) {
      setToastMessage(`Title must be ${TITLE_MAX} characters or less.`)
      return
    }

    if (content.length > CONTENT_MAX) {
      setToastMessage(`Content must be ${CONTENT_MAX.toLocaleString()} characters or less.`)
      return
    }

    if (tagCount > TAG_MAX) {
      setToastMessage(`Maximum ${TAG_MAX} tags allowed.`)
      return
    }

    setSubmitting(true)

    try {
      const response = await API.post('/posts', {
        title: title.trim(),
        content: content.trim(),
        topic_tags: topicTags.trim() || null,
      })

      // Navigate to the newly created post
      navigate(`/posts/${response.data.id}`)
    } catch (err: any) {
      setToastMessage(err.response?.data?.msg || 'Failed to create post')
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
    if (!user && !isGuest) {
      navigate('/posts')
    } else if (isGuest) {
      setToastMessage('Guests cannot create posts. Please create an account.')
      setTimeout(() => navigate('/posts'), 3000)
    }
  }, [user, isGuest, navigate])

  if (!user || isGuest) {
    return null
  }

  return (
    <CreatePostContainer>
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
                <PreviewToggle
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={showPreview ? 'active' : ''}
                >
                  <i className={`bi bi-eye${showPreview ? '-fill' : ''}`}></i> {showPreview ? 'Hide' : 'Show'} Preview
                </PreviewToggle>
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
            <SubmitButton type="submit" disabled={submitting || !title.trim() || !content.trim()}>
              {submitting ? 'Creating Post...' : 'Create Post'}
            </SubmitButton>
            <CancelButton type="button" onClick={handleCancel} disabled={submitting}>
              Cancel
            </CancelButton>
          </ButtonGroup>
        </PostForm>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </CreatePostContainer>
  )
}

export default CreatePost
