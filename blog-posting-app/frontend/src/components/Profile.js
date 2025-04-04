import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';


// This component displays the user's profile information and allows them to edit it
const Profile = () => {
  const { userId } = useParams(); // Get the userId from the URL (optional)
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState([]); // State to store the user's posts
  const [isCurrentUser, setIsCurrentUser] = useState(false); // Track if this is the current user's profile

  // Fetch the profile and posts when the component mounts or userId changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get(userId ? `/users/${userId}` : '/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfile(response.data);
        setUsername(response.data.username);
        setEmail(response.data.email);

        // Check if the profile belongs to the current user
        // Store the current user's ID in localStorage during login
        // We can now use this var to check if the profile, or blog post, belongs to the current user
        const currentUserId = localStorage.getItem('userId');
        setIsCurrentUser(currentUserId === String(response.data.id));

        // Debugging logs
        // console.log('Current User ID:', currentUserId);
        // console.log('Profile User ID:', response.data.id);
        // console.log('Is Current User:', currentUserId === String(response.data.id));

        // Fetch the user's posts
        const postsResponse = await API.get(`/users/${response.data.id}/posts`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPosts(postsResponse.data);
      } catch (error) {
        console.error('Error fetching profile or posts:', error.response?.data || error.message);
      }
    };
    // Call the fetchProfile function to get the profile and posts
    fetchProfile();
  }, [userId]);

  // Function to handle profile update
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

  // Render the profile information and edit form
  if (!profile) {
    return <p>Loading...</p>;
  }

  // Render the profile information and edit form
  return (
    <div>
      <h1>{profile.username}'s Profile</h1>
      {/* Back to blog */}
      <button onClick={() => window.history.back()} style={{ marginRight: '10px' }}>
        Back to Blog
      </button>
      <p>Email: {profile.email}</p>
      {/* If the current user is the Profile owner... */}
      {isCurrentUser && (
        <>
          <h3>Edit Profile</h3>
          <form onSubmit={handleUpdate}>
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
          </form>
          {message && <p>{message}</p>}
        </>
      )}
      <h3>Recent Posts</h3>
      {posts.length > 0 ? (
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <h4>{post.title}</h4>
              <p>{post.content}</p>
              <p style={{ fontSize: '0.8em' }}>Created At: {new Date(post.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No posts available.</p>
      )}
    </div>
  );
};

export default Profile;
