import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Correct import
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';


// This component displays the details of a specific blog post
const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const navigate = useNavigate();

  // Fetch the post details when the component mounts
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await API.get(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPost(response.data);
        // Check if the post belongs to the current user
        const currentUserId = localStorage.getItem('userId');
        setIsCurrentUser(currentUserId === String(response.data.user_id));
      } catch (err) {
        console.error('Error fetching post:', err.response?.data || err.message);
        setError('Failed to load the post. Please try again.');
      }
    };
    // Call the fetchPost function to get the post details
    fetchPost();
  }, [postId]);

  // Render the post details
  // Check if the post is being loaded
  // If there's an error, display the error message
  if (error) {
    return <p>{error}</p>;
  }
  // If the post is not found, display a loading message
  if (!post) {
    return <p>Loading...</p>;
  }

  // Render the post details
  return (
    <div>
      <button onClick={() => navigate('/posts')} style={{ marginBottom: '10px' }}>
        Back to Blog List
      </button>
      <h1>{post.title}</h1>
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
      {/* Render tags */}
      {post.topic_tags && (
        <div className="tags">
          <strong>Tags:</strong>{' '}
          {post.topic_tags.split(',').map((tag, index) => (
            <span key={index} className="tag">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
      <div className="post-info">
        <p style={{ fontSize: '0.8em' }}>
          Author: <Link to={`/profile/${post.user_id}`}>{post.author}</Link>
        </p>
        <p style={{ fontSize: '0.8em' }}>
          Posted On: {new Date(post.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
      </div>
      {isCurrentUser && (
        <>
          <button
            style={{ marginTop: '10px', marginRight: '10px' }}
            onClick={() => navigate(`/posts/${postId}/edit`)}
          >
            Edit Post
          </button>
          <button
            style={{ marginTop: '10px', backgroundColor: 'red', color: 'white' }}
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this post?')) {
                try {
                  await API.delete(`/posts/${postId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                  });
                  alert('Post deleted successfully!');
                  navigate('/posts');
                } catch (err) {
                  console.error('Error deleting post:', err.response?.data || err.message);
                  alert('Failed to delete the post. Please try again.');
                }
              }
            }}
          >
            Delete Post
          </button>
        </>
      )}
    </div>
  );
};

export default PostDetail;
