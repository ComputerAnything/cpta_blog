import React, { useEffect, useState } from 'react';
import Navbar from './Navbar'; // Import the Navbar component
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Import a syntax highlighting theme
import '../styles/BlogList.css'; // Import CSS for styling
import API from '../services/api';

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

    // Fetch posts and profiles
    fetchPosts();
    fetchProfiles();
  }, []);

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
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
      <Navbar />
      <div className="bloglist-container">
        <div className="left-panel">
          <h1 style={{ textAlign: 'center' }}>Hello {username}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => navigate('/profile')} className="styled-button">
              Profile
            </button>
            <button onClick={() => navigate('/create-post')} className="styled-button">
              Create New Post
            </button>
            <button onClick={handleLogout} className="styled-button">
              Logout
            </button>
          </div>
          <h2 style={{ textAlign: 'center' }}>Blogger Profiles</h2>
          <div className="profile-search-bar-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <input
              type="text"
              value={profileSearchTerm}
              onChange={handleProfileSearch}
              placeholder="Search profiles by username"
              className="profile-search-bar"
            />
          </div>
          <ul style={{ listStyleType: 'none', padding: 0, textAlign: 'center' }}>
            {filteredProfiles.map((profile) => (
              <li key={profile.id} style={{ marginBottom: '10px' }}>
                <Link to={`/profile/${profile.id}`} className="profile-link">
                  {profile.username}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="right-panel">
          <h1 style={{ textAlign: 'center' }}>Computer Anything Tech Blog</h1>
          <div className="search-bar-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2>Search by Tags</h2>
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
            <ul>
              {filteredPosts.map((post) => (
                <li key={post.id}>
                  <h2>
                    <Link to={`/posts/${post.id}`}>{post.title}</Link>
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
                    {/* Add the voting scale */}
                    <div className="vote-scale-container">
                      <div
                        className="vote-scale"
                        style={{
                          backgroundColor: calculateScaleColor(post.upvotes, post.downvotes),
                        }}
                      ></div>
                      <p className="vote-count">{post.upvotes - post.downvotes}</p>
                    </div>
                    <p style={{ fontSize: '0.8em' }}>
                      Author: <Link to={`/profile/${post.user_id}`}>{post.author}</Link>
                    </p>
                    <p style={{ fontSize: '0.8em' }}>
                      Posted On: {new Date(post.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No posts available or no matching posts found.</p>
          )}
        </div>
      </div>

    </>
  );
};

export default BlogList;
