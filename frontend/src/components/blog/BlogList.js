import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../redux/slices/authSlice';
import { fetchPosts, fetchProfiles } from '../../redux/slices/blogSlice';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../../styles/BlogList.css';
import LoadingScreen from '../layout/LoadingScreen';

const BlogList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest } = useSelector((state) => state.auth);
  const { posts, profiles, loading, error } = useSelector((state) => state.blog);

  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [profileSearchTerm, setProfileSearchTerm] = useState('');
  const message = location.state?.message;

  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchProfiles());
  }, [dispatch]);

  useEffect(() => {
    setFilteredPosts(posts);
  }, [posts]);

  useEffect(() => {
    setFilteredProfiles(profiles);
  }, [profiles]);

  const handleLogout = () => {
    dispatch(logoutAction());
    ['token', 'username', 'userId', 'guest'].forEach(key => localStorage.removeItem(key));
    navigate('/');
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setFilteredPosts(
      !term
        ? posts
        : posts.filter((post) => post.topic_tags?.toLowerCase().includes(term))
    );
  };

  const handleProfileSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setProfileSearchTerm(term);
    setFilteredProfiles(
      !term
        ? profiles
        : profiles.filter((profile) => profile.username.toLowerCase().includes(term))
    );
  };

  const calculateScaleColor = (upvotes, downvotes) => {
    const totalVotes = upvotes + downvotes;
    if (totalVotes === 0) return '#888';
    const ratio = upvotes / totalVotes;
    const red = Math.round(255 * (1 - ratio));
    const green = Math.round(255 * ratio);
    return `rgb(${red}, ${green}, 0)`;
  };

  return (
    <div className="bloglist-container">
      <div className="blog-panel">
        <h1 className="blog-panel-title">Computer Anything Tech Blog</h1>
        <div className="action-buttons">
          <button
            onClick={() => !isGuest && navigate('/profile')}
            className="left-panel-button"
            disabled={isGuest}
            title={isGuest ? "Sign in to view your profile" : ""}
          >
            Profile
          </button>
          <button
            onClick={() => !isGuest && navigate('/create-post')}
            className="left-panel-button"
            disabled={isGuest}
            title={isGuest ? "Sign in to create a post" : ""}
          >
            Create New Post
          </button>
          <button onClick={handleLogout} className="left-panel-button">
            {isGuest ? "Exit Guest" : "Logout"}
          </button>
        </div>

        <h2 className="search-bar-title">Blogger Profiles</h2>
        <div className="profile-search-bar-container">
          <input
            type="text"
            value={profileSearchTerm}
            onChange={handleProfileSearch}
            placeholder="Search profiles by username"
            className="search-bar"
          />
          <div className={`profile-display-area ${profileSearchTerm ? 'show' : ''}`}>
            {profileSearchTerm && (
              filteredProfiles.length > 0 ? (
                <ul className="left-panel-list">
                  {filteredProfiles.map((profile) => (
                    <li key={profile.id} className="left-panel-list-item">
                      <Link to={`/profile/${profile.id}`} className="left-panel-link">
                        {profile.username}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No profiles found.</p>
              )
            )}
          </div>
        </div>

        <div className="search-bar-container">
          <h2 className="search-bar-title">Search Blog Posts by Tags</h2>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Enter tags (e.g., #tech)"
            className="search-bar"
          />
        </div>

        {message && <p>{message}</p>}
        {loading && <LoadingScreen />}
        {error && <p className="error-message">{error}</p>}

        {filteredPosts.length > 0 ? (
          <ul className="blog-post-list">
            {filteredPosts.map((post) => (
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
                  <p
                    className="blog-post-vote-count"
                    style={{
                      color: calculateScaleColor(post.upvotes, post.downvotes),
                    }}
                  >
                    {post.upvotes - post.downvotes > 0 ? '+' : ''}
                    {post.upvotes - post.downvotes} (total votes: {post.upvotes + post.downvotes})
                  </p>
                </div>
                <p className="blog-post-meta">
                  Posted on {new Date(post.created_at).toLocaleDateString()} by{' '}
                  <Link to={`/profile/${post.user_id}`} className="blog-post-author">
                    {post.author}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No posts available or no matching posts found.</p>
        )}
      </div>
    </div>
  );
};

export default BlogList;
