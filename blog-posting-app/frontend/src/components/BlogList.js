import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/BlogList.css';
import API from '../services/api';


// BlogList component
const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]); // State for filtered posts
  const [profiles, setProfiles] = useState([]); // State to store profiles
  const [filteredProfiles, setFilteredProfiles] = useState([]); // State for filtered profiles
  const [searchTerm, setSearchTerm] = useState(''); // State for the blog post search term
  const [profileSearchTerm, setProfileSearchTerm] = useState(''); // State for the profile search term
  const [username] = useState(localStorage.getItem('username'));
  const location = useLocation();
  const navigate = useNavigate();
  const message = location.state?.message;

  // Fetch posts and profiles when the component mounts
  useEffect(() => {
    const validateTokenAndFetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/'); // Redirect to login if no token is found
        return;
      }

      try {
        // Validate the token by making a test request to the backend
        await API.get('/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // If the token is valid, fetch posts and profiles
        await fetchPosts();
        await fetchProfiles();
      } catch (error) {
        console.error('Invalid or expired token:', error.response?.data || error.message);
        localStorage.removeItem('token'); // Clear invalid token
        localStorage.removeItem('username');
        navigate('/'); // Redirect to login
      }
    };
    validateTokenAndFetchData();
  }, [navigate]);

    const fetchPosts = async () => {
      try {
        const response = await API.get('/posts', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        // Sort posts by created_at in descending order
        const sortedPosts = response.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setPosts(sortedPosts);
        setFilteredPosts(sortedPosts); // Initialize filtered posts
      } catch (error) {
        console.error('Error fetching posts:', error.response?.data || error.message);
        setPosts([]); // Clear posts if there's an error
        setFilteredPosts([]);
      }
    };

    // Fetch profiles
    const fetchProfiles = async () => {
      try {
        const response = await API.get('/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        // Sort profiles by username in ascending order
        const sortedProfiles = response.data.sort((a, b) =>
          a.username.localeCompare(b.username)
        );
        setProfiles(sortedProfiles);
        setFilteredProfiles(sortedProfiles); // Initialize filtered profiles
      } catch (error) {
        console.error('Error fetching profiles:', error.response?.data || error.message);
        setProfiles([]); // Clear profiles if there's an error
        setFilteredProfiles([]);
      }
    };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    navigate('/'); // Redirect to login page
  };

  // Function to handle blog post search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    // If the search term is empty, reset filteredPosts to show all posts
    if (!term) {
      setFilteredPosts(posts);
      return;
    }

    // Filter posts based on the search term
    const filtered = posts.filter((post) =>
      post.topic_tags?.toLowerCase().includes(term)
    );
    setFilteredPosts(filtered);
  };

  // Function to handle profile search
  const handleProfileSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setProfileSearchTerm(term);

    // If the search term is empty, reset filteredProfiles to show all profiles
    if (!term) {
      setFilteredProfiles(profiles);
      return;
    }

    // Filter profiles based on the search term
    const filtered = profiles.filter((profile) =>
      profile.username.toLowerCase().includes(term)
    );
    setFilteredProfiles(filtered);
  };

  // Calculate dynamic color based on upvotes and downvotes
  const calculateScaleColor = (upvotes, downvotes) => {
    const totalVotes = upvotes + downvotes;
    if (totalVotes === 0) return '#888'; // Neutral gray for no votes

    const ratio = upvotes / totalVotes; // Ratio of upvotes to total votes
    const red = Math.round(255 * (1 - ratio)); // More downvotes = more red
    const green = Math.round(255 * ratio); // More upvotes = more green
    return `rgb(${red}, ${green}, 0)`; // Dynamic color
  };


  // Render the list of posts and profiles
  return (
    <>
      <Navbar user={{ username }} onLogout={handleLogout} />
      <div className="bloglist-container">
        <div className="blog-panel">
          <h1 className="blog-panel-title">Computer Anything Tech Blog</h1>
          <div className="action-buttons">
            <button onClick={() => navigate('/profile')} className="left-panel-button">
              Profile
            </button>
            <button onClick={() => navigate('/create-post')} className="left-panel-button">
              Create New Post
            </button>
            <button onClick={handleLogout} className="left-panel-button">
              Logout
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
            <div className="profile-display-area">
              {profileSearchTerm ? ( // Only show the list if the search term is not empty
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
              ) : null}
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
                </li>
              ))}
            </ul>
          ) : (
            <p>No posts available or no matching posts found.</p>
          )}
        </div>
      </div>
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 Computer Anything Tech Blog. All rights reserved.</p>
          <div className="footer-logo-container">
            <p>Created by:</p>
            <img
              src="/img/cpt_anything_box_thumb.jpg"
              alt="CPT Anything"
              className="footer-logo"
            />
          </div>
        </div>
      </footer>
    </>
  );
};

export default BlogList;
