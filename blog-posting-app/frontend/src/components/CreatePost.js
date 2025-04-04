import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';


// This component allows users to create a new blog post
const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post(
        '/posts',
        { title, content },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessage('Post created successfully!');
      setTimeout(() => navigate('/posts'), 2000); // Redirect to blog list after 2 seconds
    } catch (error) {

      console.error('Error creating post:', error.response?.data || error.message);
      setMessage('Failed to create post. Please try again.');
    }
  };

  // Render the form for creating a new post
  return (
    <div>
      <h1>Create a New Post</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Post</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreatePost;
