import React, { useState } from 'react';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import '../styles/CreateEditPost.css';


const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const username = localStorage.getItem('username');

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format tags: Add # prefix to each tag and remove extra spaces
    const formattedTags = tags
      .split(',')
      .map((tag) => `#${tag.trim()}`)
      .join(', ');
    // Check if the title and content are not empty
    try {
      await API.post(
        '/posts',
        { title, content, topic_tags: formattedTags }, // Include formatted tags
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessage('Post created successfully!');
      setTimeout(() => navigate('/posts'), 2000);
    } catch (error) {
      console.error('Error creating post:', error.response?.data || error.message);
      setMessage('Failed to create post. Please try again.');
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/'; // Redirect to the homepage or login page
  };


  // Render the create post form
  return (
    <>
      <Navbar user={{ username }} onLogout={handleLogout} />
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
          <form onSubmit={handleSubmit}>
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
            <button type="submit">Create Post</button>
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
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 Computer Anything Tech Blog. All rights reserved.</p>
          <div className="footer-logo-container">
            <p>Created by:</p>
            <img
              src="/img/cpt_anything_box_thumb.jpg"
              alt="CPT Anything"
              className="footer-logo"
            />
          </div>
        </div>
      </footer>
    </>
  );
};

export default CreatePost;
