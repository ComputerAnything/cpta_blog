import React, { useEffect, useState } from 'react';
import Navbar from './Navbar'; // Import the Navbar component
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
  const [comments, setComments] = useState([]);
  const [username] = useState(localStorage.getItem('username'));
  const [commentContent, setCommentContent] = useState('');

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

  // Fetch comments when the component mounts
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await API.get(`/posts/${postId}/comments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setComments(response.data);
      } catch (error) {
        console.error('Error fetching comments:', error.response?.data || error.message);
      }
    };
    fetchComments();
  }, [postId]);

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post(
        `/posts/${postId}/comments`,
        { content: commentContent },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setComments((prevComments) => [...prevComments, response.data]);
      setCommentContent(''); // Clear the input field
    } catch (error) {
      console.error('Error submitting comment:', error.response?.data || error.message);
    }
  };

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

  const markdownComponents = {
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
  };

  // Function to handle deleting a comment
  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/posts/${postId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error.response?.data || error.message);
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/'; // Redirect to the homepage or login page
  };


  // Render the post details
  return (
    <>
      <Navbar user={{ username }} onLogout={handleLogout} />
      <div className="post-detail-container">
        {/* Post Header */}
        <div className="post-header">
          <button className="back-button" onClick={() => navigate('/posts')}>
            Back to Blog List
          </button>
          {post.user_id === parseInt(currentUserId) && (
            <button
              className="edit-button"
              onClick={() => navigate(`/edit-post/${postId}`)}
            >
              Edit Post
            </button>
          )}
        </div>
          {/* Post Actions */}
          <div className="post-actions">
            <button className="comment-button" onClick={() => document.querySelector('.comments-section textarea').focus()}>
              Comment
            </button>
            <button className="share-button" onClick={handleShare}>
              Share Post
            </button>
          </div>

        {/* Post Content Section */}
        <div className="post-main-container">
          {/* Voting Buttons */}
          <div className="vote-buttons">
            <button className="upvote-button" onClick={handleUpvote}>
              ▲
            </button>
            <p className="vote-count">{post.upvotes - post.downvotes}</p>
            <button className="downvote-button" onClick={handleDownvote}>
              ▼
            </button>
          </div>

          {/* Post Content */}
          <div className="post-content">
            <h1 className="post-title">{post.title}</h1>
            {post.topic_tags && (
              <div className="tags">
                {post.topic_tags.split(',').map((tag, index) => (
                  <span key={index} className="tag">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
            <ReactMarkdown
              children={post.content}
              components={markdownComponents} // Reuse the components configuration
            />
            <div className="post-info">
              <p>
                Author: <Link to={`/profile/${post.user_id}`}>{post.author}</Link>
              </p>
              <p>
                Posted On: {new Date(post.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>

            {/* Add the voting scale */}
            <div className="vote-scale-container">
              <div
                className="vote-scale"
                style={{
                  backgroundColor: calculateScaleColor(post.upvotes, post.downvotes),
                }}
              ></div>
              <p className="vote-count">{post.upvotes - post.downvotes}</p>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3>Comments</h3>
            <ul>
              {[...comments].reverse().map((comment) => (
                <li key={comment.id}>
                  <p><strong>{comment.username}:</strong></p>
                  <div className="comment-content">
                    <ReactMarkdown
                      children={comment.content}
                      components={markdownComponents} // Reuse the same components configuration
                    />
                  </div>
                  <p style={{ fontSize: '0.8em', color: '#888' }}>
                    Posted on: {new Date(comment.created_at).toLocaleString()}
                  </p>
                  {/* Delete button (only visible to the comment owner) */}
                  {comment.user_id === parseInt(currentUserId) && (
                    <button
                      className="delete-comment-button"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write your comment (Markdown supported)..."
              required
            />
            <button type="submit">Submit Comment</button>
          </form>
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

export default PostDetail;
