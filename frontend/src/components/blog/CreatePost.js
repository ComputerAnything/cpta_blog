import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createPost } from '../../redux/slices/blogSlice';
import '../../styles/CreateEditPost.css';
import LoadingScreen from '../layout/LoadingScreen';

const CreatePost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.blog);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const formRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedTags = tags
      .split(',')
      .map((tag) => `#${tag.trim()}`)
      .join(', ');
    const resultAction = await dispatch(
      createPost({ title, content, topic_tags: formattedTags })
    );
    if (createPost.fulfilled.match(resultAction)) {
      setMessage('Post created successfully!');
      setTimeout(() => navigate('/posts'), 2000);
    } else {
      setMessage(resultAction.payload || 'Failed to create post. Please try again.');
    }
  };

  // This handler will trigger the form submit
  const handleButtonClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <div className="create-edit-post-container">
        <div className="form-section">
          <h1>Create New Post</h1>
          <button
            className="back-to-blog-btn"
            onClick={() => navigate('/posts')}
            style={{ marginBottom: '20px' }}
          >
            Back to Blog
          </button>
          <form ref={formRef} onSubmit={handleSubmit}>
            <div>
              <label>Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Content (Markdown Supported):</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post in Markdown format..."
                required
              />
            </div>
            <div>
              <label>Tags (comma-separated, e.g., tech, programming):</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value.replace(/#/g, ""))}
                placeholder="e.g., tech, programming, AI"
              />
            </div>
          </form>
          {(message || error) && <p>{message || error}</p>}
        </div>
        <div className="preview-section">
          <h2>Preview</h2>
          <div className="preview-content">
            <h1>{title || 'Post Title'}</h1>
            <ReactMarkdown
              children={content || 'Start writing your post content to see the preview here...'}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
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
                  );
                },
              }}
            />
            {tags && (
              <div className="tags">
                <strong>Tags:</strong>{' '}
                {tags.split(',').map((tag, index) => (
                  <span key={index} className="tag">
                    {`#${tag.trim()}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* Submit button moved here */}
          <button
            type="button"
            className="create-post-submit-btn"
            onClick={handleButtonClick}
            disabled={loading}
            style={{ marginTop: '24px' }}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreatePost;
