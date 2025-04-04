import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';


// This component displays the details of a single blog post
const PostDetail = () => {
  const { postId } = useParams(); // Get the post ID from the URL
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false); // Track if the post belongs to the current user
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
        const currentUserId = localStorage.getItem('userId'); // Get the current user's ID from localStorage
        setIsCurrentUser(currentUserId === String(response.data.user_id)); // Compare as strings
      } catch (err) {
        console.error('Error fetching post:', err.response?.data || err.message);
        setError('Failed to load the post. Please try again.');
      }
    };
    // Call the fetchPost function to get the post details
    fetchPost();
  }, [postId]);

  // If there's an error, display it
  if (error) {
    return <p>{error}</p>;
  }

  // If the post is not available, show a loading message
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
      <p>{post.content}</p>
      <p style={{ fontSize: '0.8em' }}>
        Author: <Link to={`/profile/${post.user_id}`}>{post.author}</Link>
      </p>
      <p style={{ fontSize: '0.8em' }}>
        Posted On: {new Date(post.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
      </p>
      {/* Show the Edit button if the post belongs to the current user */}
      {isCurrentUser && (
        <button
          style={{ marginTop: '10px' }}
          onClick={() => navigate(`/posts/${postId}/edit`)} // Navigate to the EditPost page
        >
          Edit Post
        </button>
      )}
    </div>
  );
};

export default PostDetail;
