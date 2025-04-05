import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import '../styles/CreateEditPost.css'; // Reuse the CreatePost styles

const EditPost = () => {
  const { postId } = useParams(); // Get the post ID from the URL
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Fetch the post details when the component mounts
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await API.get(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTitle(response.data.title);
        setContent(response.data.content);
        setTags(response.data.topic_tags || ''); // Set tags if available
      } catch (error) {
        console.error('Error fetching post:', error.response?.data || error.message);
        setMessage('Failed to load the post. Please try again.');
      }
    };
    fetchPost();
  }, [postId]);

  // Handle form submission to update the post
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Format tags: Add # prefix to each tag and remove extra spaces
    const formattedTags = tags
      .split(',')
      .map((tag) => `#${tag.trim()}`)
      .join(', ');

    try {
      const response = await API.put(
        `/posts/${postId}`,
        { title, content, topic_tags: formattedTags },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessage('Post updated successfully!');
      setTimeout(() => navigate(`/posts/${postId}`), 2000); // Redirect to the post detail page after 2 seconds
    } catch (error) {
      console.error('Error updating post:', error.response?.data || error.message);
      setMessage('Failed to update the post. Please try again.');
    }
  };

  // Render the edit post form
  return (
    <div className="create-edit-post-container">
      <div className="form-section">
        <h1>Edit Post</h1>
        <button
          className="back-to-blog-btn"
          onClick={() => navigate(`/posts/${postId}`)}
          style={{ marginBottom: '20px' }}
        >
          Back to Post
        </button>
        <form onSubmit={handleUpdate}>
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
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., tech, programming, AI"
            />
          </div>
          <button type="submit">Update Post</button>
        </form>
        {message && <p>{message}</p>}
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
      </div>
    </div>
  );
};

export default EditPost;
