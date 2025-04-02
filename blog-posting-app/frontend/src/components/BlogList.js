import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import API from '../services/api';


// This component fetches and displays a list of blog posts
const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const message = location.state?.message;

  // Fetch posts from the API when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await API.get('/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };
    // Call the fetchPosts function
    fetchPosts();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove the token from localStorage
    navigate('/'); // Redirect to the login page
  };

  // Render the list of posts
  return (
    <div>
      <h1>Blog Posts</h1>
      {message && <p>{message}</p>}
      <button onClick={handleLogout}>Logout</button> {/* Add Logout button */}
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlogList;
