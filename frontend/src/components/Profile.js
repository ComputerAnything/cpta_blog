import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import API from '../services/api';
import '../styles/Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(localStorage.getItem('username'));
  const [totalVotes, setTotalVotes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch the user's profile, posts, and comments when the component mounts
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
        setIsCurrentUser(!userId || currentUserId === String(response.data.id));

        // Fetch posts
        const postsResponse = await API.get(`/users/${response.data.id}/posts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const sortedPosts = postsResponse.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(sortedPosts);

        // Calculate total votes
        const votesResponse = await API.get(`/users/${response.data.id}/votes/count`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTotalVotes(votesResponse.data.count || 0);

        // Fetch comments count for the user
        const commentsResponse = await API.get(`/users/${response.data.id}/comments/count`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setTotalComments(commentsResponse.data.count || 0);

      } catch (error) {
        console.error('Error fetching profile or posts:', error.response?.data || error.message);
      }
    };
    fetchProfile();
  }, [userId]);

  // Keep currentUserName in sync with localStorage
  useEffect(() => {
    setCurrentUserName(localStorage.getItem('username'));
  }, [username]);

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
      localStorage.setItem('username', username);
      setCurrentUserName(username);
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      setMessage('Failed to update profile. Please try again.');
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await API.delete('/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      localStorage.clear();
      setMessage('Your account has been deleted.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      setMessage('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/'; // Redirect to the homepage or login page
  };

  // Render the profile and posts
  if (!profile) {
    return <p>Loading...</p>;
  }

// Stats block to show posts, votes, and comments
const statsBlock = (
  <div className="profile-stats">
    <span className="profile-stat-item">
      <span className="profile-stat-icon" role="img" aria-label="posts">📝</span>
      <strong>Posts:</strong> {posts.length}
    </span>
    <span className="profile-stat-item">
      <span className="profile-stat-icon" role="img" aria-label="votes">👍</span>
      <strong>Votes:</strong> {totalVotes}
    </span>
    <span className="profile-stat-item">
      <span className="profile-stat-icon" role="img" aria-label="comments">💬</span>
      <strong>Comments:</strong> {totalComments}
    </span>
  </div>
);

// If viewing someone else's profile
if (!isCurrentUser) {
  return (
    <>
      <Navbar user={{ username: currentUserName }} />
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-header-title">{profile.username}'s Profile</h1>
          <p className="profile-header-info">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
          {statsBlock}
          <button
            className="profile-btn profile-back-to-blog-btn"
            onClick={() => navigate('/posts')}
            type="button"
          >
            Back to Blog
          </button>
        </div>
        <div className="recent-posts">
          <h3 className="recent-posts-title">{profile.username}'s Posts</h3>
          {posts.length > 0 ? (
            <ul className="blog-post-list">
              {posts.map((post) => (
                <li key={post.id} className="blog-post-item">
                  <h2 className="blog-post-title">
                    <Link to={`/posts/${post.id}`} className="blog-post-link">
                      {post.title}
                    </Link>
                  </h2>
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
                  {post.topic_tags && (
                    <div className="blog-post-tags">
                      {post.topic_tags.split(',').map((tag, index) => (
                        <span key={index} className="blog-post-tag">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="blog-post-votes">
                    <p className="blog-post-vote-count">
                      {post.upvotes - post.downvotes > 0 ? '+' : ''}
                      {post.upvotes - post.downvotes} (total votes: {post.upvotes + post.downvotes})
                    </p>
                  </div>
                  <p className="blog-post-meta">
                    Posted on {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No posts available.</p>
          )}
        </div>
      </div>
    </>
  );
}

// If viewing own profile, show full controls
const emailStatus = profile.is_verified ? (
  <span className="profile-email-verified">Verified</span>
) : (
  <span className="profile-email-not-verified">Not Verified</span>
);

return (
  <>
    <Navbar user={{ username: currentUserName }} onLogout={handleLogout} />
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-header-title">{profile.username}'s Profile</h1>
        <p className="profile-header-info">
          Email: {profile.email} {emailStatus}
        </p>
        {statsBlock}
        <button
          className="profile-btn profile-back-to-blog-btn"
          onClick={() => navigate('/posts')}
          type="button"
        >
          Back to Blog
        </button>
        <button
          className="profile-btn profile-edit-profile-btn"
          onClick={() => setShowEditForm((prev) => !prev)}
          type="button"
        >
          {showEditForm ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>
      {showEditForm && (
        <form className="edit-profile-form" onSubmit={handleUpdate}>
          <h3 className="edit-profile-form-title">Edit Profile</h3>
          <div>
            <label className="edit-profile-form-label">Username:</label>
            <input
              className="edit-profile-form-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <button className="edit-profile-form-btn" type="submit">Update Profile</button>
          {message && <p className="edit-profile-form-message">{message}</p>}
          <button
            type="button"
            className="profile-btn profile-delete-profile-btn"
            onClick={handleDeleteProfile}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Profile'}
          </button>
        </form>
      )}
      <div className="recent-posts">
        <h3 className="recent-posts-title">{profile.username}'s Posts</h3>
        {posts.length > 0 ? (
          <ul className="blog-post-list">
            {posts.map((post) => (
              <li key={post.id} className="blog-post-item">
                <h2 className="blog-post-title">
                  <Link to={`/posts/${post.id}`} className="blog-post-link">
                    {post.title}
                  </Link>
                </h2>
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
                {post.topic_tags && (
                  <div className="blog-post-tags">
                    {post.topic_tags.split(',').map((tag, index) => (
                      <span key={index} className="blog-post-tag">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <div className="blog-post-votes">
                  <p className="blog-post-vote-count">
                    {post.upvotes - post.downvotes > 0 ? '+' : ''}
                    {post.upvotes - post.downvotes} (total votes: {post.upvotes + post.downvotes})
                  </p>
                </div>
                <p className="blog-post-meta">
                  Posted on {new Date(post.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No posts available.</p>
        )}
      </div>
    </div>
  </>
);
};

export default Profile;
