import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../services/api';


// This component displays a list of blog posts
const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [username] = useState(localStorage.getItem('username'));
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message;

  // Fetch posts and author information when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await API.get('/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error.response?.data || error.message);
        setPosts([]); // Clear posts if there's an error
      }
    };
    // Call the fetchPosts function to get the posts
    fetchPosts();
  }, []);

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  // Render the list of posts
  return (
    <div>
      <h1>Hello {username}, Welcome to the Computer Anything Blog!</h1>
      <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>
        Profile
      </button>
      <button onClick={() => navigate('/create-post')} style={{ marginRight: '10px' }}>
        Create New Post
      </button>
      <button onClick={handleLogout}>
        Logout
      </button>
      <h1>Blog Posts</h1>
      {message && <p>{message}</p>}
      {posts.length > 0 ? (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h2>
                <Link to={`/posts/${post.id}`}>{post.title}</Link>
              </h2>
              <p>{post.content}</p>
              <p style={{ fontSize: '0.8em' }}>Author: {post.author}</p>
              <p style={{ fontSize: '0.8em' }}>Created At: {new Date(post.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No posts available or an error occurred.</p>
      )}
    </div>
  );
};

export default BlogList;
