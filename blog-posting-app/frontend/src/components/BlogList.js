import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Import a syntax highlighting theme
import '../styles/BlogList.css'; // Import CSS for styling
import API from '../services/api';


// This component displays a list of blog posts and allows users to search by tags
const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]); // State for filtered posts
  const [profiles, setProfiles] = useState([]); // State to store profiles
  const [searchTerm, setSearchTerm] = useState(''); // State for the search term
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
        setPosts(response.data);
        setFilteredPosts(response.data); // Initialize filtered posts
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
        setProfiles(response.data);
      } catch (error) {
        console.error('Error fetching profiles:', error.response?.data || error.message);
        setProfiles([]); // Clear profiles if there's an error
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

  // Function to handle search
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

  // Render the list of posts and profiles
  return (
    <div className="bloglist-container">
      <div className="left-panel">
        <h1>Hello {username}</h1>
        <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>
          Profile
        </button>
        <button onClick={() => navigate('/create-post')} style={{ marginRight: '10px' }}>
          Create New Post
        </button>
        <button onClick={handleLogout}>
          Logout
        </button>
        <h2>Checkout Other Blogger Profiles</h2>
        <ul>
          {profiles.map((profile) => (
            <li key={profile.id}>
              <Link to={`/profile/${profile.id}`}>{profile.username}</Link>
            </li>
          ))}
        </ul>
        <h2>Search by Tags</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Enter tags (e.g., #tech)"
          className="search-bar"
        />
      </div>
      <div className="right-panel">
        <h1>Computer Anything Tech Blog</h1>
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
  );
};

export default BlogList;
