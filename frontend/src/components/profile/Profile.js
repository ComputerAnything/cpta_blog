import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  fetchUserPosts,
  fetchUserStats,
  updateProfile,
  deleteProfile,
} from '../../redux/slices/profileSlice';
import '../../styles/Profile.css';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    profile,
    userPosts,
    userStats,
    updateMessage,
    deleting,
    loading,
    error,
  } = useSelector((state) => state.profile);

  const [username, setUsername] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch profile first (always)
  useEffect(() => {
    dispatch(fetchUserProfile(userId || null));
  }, [dispatch, userId]);

  // When profile is loaded, fetch posts and stats using the correct userId
  useEffect(() => {
    if (profile && profile.id) {
      dispatch(fetchUserPosts(profile.id));
      dispatch(fetchUserStats(profile.id));
    }
  }, [dispatch, profile]);

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    // Only username is editable, but send both fields
    dispatch(updateProfile({ username, email: profile.email }));
  };

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    dispatch(deleteProfile()).then(() => {
      localStorage.clear();
      navigate('/');
    });
  };

  // Render loading/error
  if (loading || !profile) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  // Stats block
  const statsBlock = (
    <div className="profile-stats">
      <span className="profile-stat-item">
        <span className="profile-stat-icon" role="img" aria-label="posts">📝</span>
        <strong>Posts:</strong> {userPosts.length}
      </span>
      <span className="profile-stat-item">
        <span className="profile-stat-icon" role="img" aria-label="votes">👍</span>
        <strong>Votes:</strong> {userStats.votes}
      </span>
      <span className="profile-stat-item">
        <span className="profile-stat-icon" role="img" aria-label="comments">💬</span>
        <strong>Comments:</strong> {userStats.comments}
      </span>
    </div>
  );

  // If viewing someone else's profile
  const currentUserId = localStorage.getItem('userId');
  const isCurrentUser = !userId || currentUserId === String(profile.id);

  const emailStatus = profile.is_verified ? (
    <span className="profile-email-verified">Verified</span>
  ) : (
    <span className="profile-email-not-verified">Not Verified</span>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1 className="profile-header-title">{profile.username}'s Profile</h1>
        <p className="profile-header-info">
          {isCurrentUser
            ? <>Email: {profile.email} {emailStatus}</>
            : <>Joined: {new Date(profile.created_at).toLocaleDateString()}</>
          }
        </p>
        {statsBlock}
        <button
          className="profile-btn profile-back-to-blog-btn"
          onClick={() => navigate('/posts')}
          type="button"
        >
          Back to Blog
        </button>
        {isCurrentUser && (
          <button
            className="profile-btn profile-edit-profile-btn"
            onClick={() => setShowEditForm((prev) => !prev)}
            type="button"
          >
            {showEditForm ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        )}
      </div>
      {isCurrentUser && showEditForm && (
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
          {updateMessage && <p className="edit-profile-form-message">{updateMessage}</p>}
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
        {userPosts.length > 0 ? (
          <ul className="blog-post-list">
            {userPosts.map((post) => (
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
  );
};

export default Profile;
