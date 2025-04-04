import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';


// This component displays the details of a single blog post
const PostDetail = () => {
  const { postId } = useParams(); // Get the post ID from the URL
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      <button onClick={() => navigate('/blog')} style={{ marginBottom: '10px' }}>
        Back to Blog List
      </button>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <p style={{ fontSize: '0.8em' }}>Author: {post.author}</p>
      <p style={{ fontSize: '0.8em' }}>Created At: {new Date(post.created_at).toLocaleString()}</p>
    </div>
  );
};

export default PostDetail;
