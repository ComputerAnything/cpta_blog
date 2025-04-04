import React, { useEffect, useState } from 'react';
import API from '../services/api';


// This component handles user profile management
const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Fetch the user's profile when the component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get('/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfile(response.data);
        setUsername(response.data.username);
        setEmail(response.data.email);
      } catch (error) {
        console.error('Error fetching profile:', error.response?.data || error.message);
      }
    };
    // Call the fetchProfile function to get the user's profile
    fetchProfile();
  }, []);

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

      // Update the profile state with the new values
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

  // If the profile is not available, show a loading message
  if (!profile) {
    return <p>Loading...</p>;
  }

  // Render the profile management form
  return (
    <div>
      <h1>Profile</h1>
      {/* Back to BlogList button */}
      <button onClick={() => window.history.back()} style={{ marginBottom: '10px' }}>
        Back to Blog List
      </button>
      {/* Profile information */}
      <h2>Welcome, {profile.username}</h2>
      <p>Email: {profile.email}</p>
      <h3>Update Profile</h3>
      <p>Update your username and email address below:</p>
      <p style={{ fontSize: '0.8em' }}>
        Note: You can only update your username and email address. To change your password, please contact support.
      </p>
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
    </div>
  );
};

export default Profile;
