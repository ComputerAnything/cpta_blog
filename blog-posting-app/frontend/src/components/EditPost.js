import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';


// This component allows users to edit an existing blog post
const EditPost = () => {
  const { postId } = useParams(); // Get the post ID from the URL
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Fetch the post details when the component mounts
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await API.get(`/posts/${postId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTitle(response.data.title);
        setContent(response.data.content);
      } catch (error) {
        console.error('Error fetching post:', error.response?.data || error.message);
        setMessage('Failed to load the post. Please try again.');
      }
    };
    // Call the fetchPost function to get the post details
    fetchPost();
  }, [postId]);

  // Handle form submission to update the post
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await API.put(
        `/posts/${postId}`,
        { title, content },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessage('Post updated successfully!');
      setTimeout(() => navigate(`/posts/${postId}`), 2000); // Redirect to the post detail page after 2 seconds
    } catch (error) {
      console.error('Error updating post:', error.response?.data || error.message);
      setMessage('Failed to update the post. Please try again.');
    }
  };

  // Render the edit post form
  return (
    <div>
      <h1>Edit Post</h1>
      <form onSubmit={handleUpdate}>
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
          <label>Content (Markdown Supported):</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post in Markdown format..."
            required
          />
        </div>
        <button type="submit">Update Post</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default EditPost;
