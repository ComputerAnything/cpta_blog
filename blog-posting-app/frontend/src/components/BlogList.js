import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [username] = useState(localStorage.getItem('username'));
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message;

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

    fetchPosts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <div>
      <h1>Welcome to the Blog!</h1>
      <h2>Hello {username}</h2>
      <h1>Blog Posts</h1>
      {message && <p>{message}</p>}
      <button onClick={handleLogout}>Logout</button>
      {posts.length > 0 ? (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h2>{post.title}</h2>
              <p>{post.content}</p>
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
