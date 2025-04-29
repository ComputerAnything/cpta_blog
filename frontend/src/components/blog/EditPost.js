import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { fetchPosts, updatePost, deletePost } from '../../redux/slices/blogSlice';
import '../../styles/CreateEditPost.css';
import LoadingScreen from '../layout/LoadingScreen';

const EditPost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { postId } = useParams();
  const { posts, loading, error } = useSelector((state) => state.blog);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef();

  // Load post data
  useEffect(() => {
    if (!posts.length) {
      dispatch(fetchPosts());
    }
  }, [dispatch, posts.length]);

  useEffect(() => {
    const post = posts.find((p) => String(p.id) === String(postId));
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setTags(
        post.topic_tags
          ? post.topic_tags
              .split(',')
              .map((tag) => tag.replace(/#/g, '').trim())
              .join(', ')
          : ''
      );
    }
  }, [posts, postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedTags = tags
      .split(',')
      .map((tag) => `#${tag.trim()}`)
      .join(', ');
    const resultAction = await dispatch(
      updatePost({ id: postId, title, content, topic_tags: formattedTags })
    );
    if (updatePost.fulfilled.match(resultAction)) {
      setMessage('Post updated successfully!');
      setTimeout(() => navigate('/posts'), 2000);
    } else {
      setMessage(resultAction.payload || 'Failed to update post. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    setDeleting(true);
    const resultAction = await dispatch(deletePost(postId));
    setDeleting(false);
    if (deletePost.fulfilled.match(resultAction)) {
      navigate('/posts', { state: { message: 'Post deleted successfully.' } });
    } else {
      setMessage(resultAction.payload || 'Failed to delete post. Please try again.');
    }
  };

  // This handler will trigger the form submit
  const handleButtonClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  if (loading && !posts.length) return <LoadingScreen />;

  return (
    <div className="create-edit-post-container">
      <div className="form-section">
        <h1>Edit Post</h1>
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
        <button
          type="button"
          className="create-post-submit-btn"
          onClick={handleButtonClick}
          disabled={loading}
          style={{ marginTop: '24px' }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          className="delete-post-btn"
          onClick={handleDelete}
          disabled={deleting}
          style={{ marginTop: '12px', background: '#c00', color: '#fff' }}
        >
          {deleting ? 'Deleting...' : 'Delete Post'}
        </button>
      </div>
    </div>
  );
};

export default EditPost;
