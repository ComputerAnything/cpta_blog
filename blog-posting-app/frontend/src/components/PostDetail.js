import React, { useEffect, useState } from 'react';
import Navbar from './Navbar'; // Import the Navbar component
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import '../styles/PostDetail.css'; // Import the CSS file

// TODO: When there is a code block in the post, the code block doesnt shrink to fit the screen.
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
          <p className="post-meta">
            Posted by <Link to={`/profile/${post.user_id}`}>{post.author}</Link> on{' '}
            {new Date(post.created_at).toLocaleDateString()}
          </p>
          <h1>{post.title}</h1>
          {post.topic_tags && (
            <div className="post-tags">
              {post.topic_tags.split(',').map((tag, index) => (
                <span key={index} className="tag">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Content */}
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

        {/* Voting Section */}
        <div className="vote-section">
          <button className="upvote-button" onClick={handleUpvote}>
            ▲
          </button>
          <p
            className="vote-count"
            style={{
              color: calculateScaleColor(post.upvotes, post.downvotes), // Dynamically set the color
            }}
          >
            {post.upvotes - post.downvotes} (total votes: {post.upvotes + post.downvotes})
          </p>
          <button className="downvote-button" onClick={handleDownvote}>
            ▼
          </button>
          <div className="post-activity-buttons">
            <button className="back-button" onClick={() => navigate('/posts')}>
              Back to Blog List
            </button>
            <button className="share-button" onClick={handleShare}>
              Share Post
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
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h2>Comments</h2>
          <ul>
            {comments.map((comment) => (
              <li key={comment.id} className="comment">
                <p>
                  <strong>{comment.username}</strong> commented:
                </p>
                <ReactMarkdown
                  children={comment.content}
                  components={markdownComponents} // Use the same components configuration
                />
                {/* Show Delete Button if the comment belongs to the current user */}
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
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Write a comment..."
              required
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default PostDetail;
