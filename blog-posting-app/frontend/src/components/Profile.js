import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Import a syntax highlighting theme
import API from '../services/api';
import '../styles/Profile.css'; // Import the CSS file


// This component displays the user's profile and allows them to edit their information
const Profile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // Fetch the user's profile and posts when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get(userId ? `/users/${userId}` : '/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfile(response.data);
        setUsername(response.data.username);
        setEmail(response.data.email);

        const currentUserId = localStorage.getItem('userId');
        setIsCurrentUser(currentUserId === String(response.data.id));

        const postsResponse = await API.get(`/users/${response.data.id}/posts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const sortedPosts = postsResponse.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching profile or posts:', error.response?.data || error.message);
      }
    };
    fetchProfile();
  }, [userId]);

  // Handle form submission to update the profile
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await API.put(
        '/profile',
        { username, email },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setMessage(response.data.msg);
      setProfile((prevProfile) => ({
        ...prevProfile,
        username,
        email,
      }));
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      setMessage('Failed to update profile. Please try again.');
    }
  };

  // Render the profile and posts
  if (!profile) {
    return <p>Loading...</p>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>{profile.username}'s Profile</h1>
        <p>Email: {profile.email}</p>
        <button className="back-to-blog-btn" onClick={() => window.history.back()}>
          Back to Blog
        </button>
      </div>
      {isCurrentUser && (
        <form className="edit-profile-form" onSubmit={handleUpdate}>
          <h3>Edit Profile</h3>
          <div>
            <label>Username:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">Update Profile</button>
          {message && <p>{message}</p>}
        </form>
      )}
      <div className="recent-posts">
        <h3>Recent Posts</h3>
        {posts.length > 0 ? (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <h3>
                  <Link to={`/posts/${post.id}`}>{post.title}</Link>
                </h3>
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
                {/* Render tags */}
                {post.topic_tags && (
                  <div className="tags">
                    <strong>Topic Tags:</strong>{' '}
                    {post.topic_tags.split(',').map((tag, index) => (
                      <span key={index} className="tag">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="post-info">
                  <p style={{ fontSize: '0.8em' }}>
                    Posted On: {new Date(post.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts available.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
