import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import '../styles/PostDetail.css'; // Import the CSS file


// This component displays the details of a blog post, including the title, content, author, and tags.
const PostDetail = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId'); // Get the current user's ID from localStorage

  // Fetch the post details when the component mounts
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

  // Handle Votes
  const handleUpvote = async () => {
    try {
      const response = await API.post(`/posts/${postId}/upvote`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPost((prevPost) => ({
        ...prevPost,
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
      }));
    } catch (error) {
      console.error('Error upvoting post:', error.response?.data || error.message);
    }
  };
  const handleDownvote = async () => {
    try {
      const response = await API.post(`/posts/${postId}/downvote`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPost((prevPost) => ({
        ...prevPost,
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
      }));
    } catch (error) {
      console.error('Error downvoting post:', error.response?.data || error.message);
    }
  };

  // Handle sharing the post
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

  // Function to calculate the color of the scale based on upvotes and downvotes
  const calculateScaleColor = (upvotes, downvotes) => {
    const totalVotes = upvotes + downvotes;
    if (totalVotes === 0) return '#888'; // Neutral gray for no votes

    const ratio = upvotes / totalVotes; // Ratio of upvotes to total votes
    const red = Math.round(255 * (1 - ratio)); // More downvotes = more red
    const green = Math.round(255 * ratio); // More upvotes = more green
    return `rgb(${red}, ${green}, 0)`; // Dynamic color
  };

  // Handle the back button click
  if (error) {
    return <p>{error}</p>;
  }
  // If the post is not yet loaded, show a loading message
  if (!post) {
    return <p>Loading...</p>;
  }

  // Render the post details
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
      <p>Upvotes: {post.upvotes}</p>
      <p>Downvotes: {post.downvotes}</p>
      <div className="vote-scale-container">
        <div
          className="vote-scale"
          style={{
            width: '100%',
            height: '10px',
            backgroundColor: calculateScaleColor(post.upvotes, post.downvotes),
            borderRadius: '5px',
          }}
        ></div>
      </div>
      <button className="upvote-button" onClick={handleUpvote}>Upvote</button>
      <button className="downvote-button" onClick={handleDownvote}>Downvote</button>
        <p>
          Author: <Link to={`/profile/${post.user_id}`}>{post.author}</Link>
        </p>
        <p>
          Posted On: {new Date(post.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
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
