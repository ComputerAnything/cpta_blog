import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import '../styles/PostDetail.css'; // Import the CSS file

const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId'); // Get the current user's ID from localStorage

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await API.get(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPost(response.data);
      } catch (err) {
        console.error('Error fetching post:', err.response?.data || err.message);
        setError('Failed to load the post. Please try again.');
      }
    };
    fetchPost();
  }, [postId]);

  const handleShare = () => {
    const shareData = {
      title: post.title,
      text: post.content,
      url: `${window.location.origin}/posts/${postId}`,
    };

    if (navigator.share) {
      navigator.share(shareData).catch((err) => console.error('Error sharing:', err));
    } else {
      alert('Sharing is not supported in this browser. Copy the URL to share.');
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!post) {
    return <p>Loading...</p>;
  }

  return (
    <div className="post-detail-container">
      <button className="back-button" onClick={() => navigate('/posts')}>
        Back to Blog List
      </button>
      <div className="post-header">
        <h1>{post.title}</h1>
        {post.topic_tags && (
          <div className="tags">
            {post.topic_tags.split(',').map((tag, index) => (
              <span key={index} className="tag">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="post-content">
        <ReactMarkdown
          children={post.content}
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
      </div>
      <div className="post-info">
        <p>
          Author: <Link to={`/profile/${post.user_id}`}>{post.author}</Link>
        </p>
        <p>Posted On: {new Date(post.created_at).toLocaleString()}</p>
      </div>
      {post.user_id === parseInt(currentUserId) && ( // Check if the post belongs to the current user
        <button
          className="edit-button"
          onClick={() => navigate(`/edit-post/${postId}`)}
        >
          Edit Post
        </button>
      )}
      <button className="share-button" onClick={handleShare}>
        Share Post
      </button>
    </div>
  );
};

export default PostDetail;
