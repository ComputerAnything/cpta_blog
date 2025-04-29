import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';
import { setCredentials } from './authSlice';

// Fetch current or specific user profile
export const fetchUserProfile = createAsyncThunk('profile/fetchUserProfile', async (userId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const url = userId ? `/users/${userId}` : '/profile';
    const response = await API.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to fetch profile');
  }
});

// Fetch posts by a specific user
export const fetchUserPosts = createAsyncThunk('profile/fetchUserPosts', async (userId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.get(`/users/${userId}/posts`, { headers: { Authorization: `Bearer ${token}` } });
    return response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to fetch posts');
  }
});

// Fetch user stats (votes and comments)
export const fetchUserStats = createAsyncThunk('profile/fetchUserStats', async (userId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const [votes, comments] = await Promise.all([
      API.get(`/users/${userId}/votes/count`, { headers: { Authorization: `Bearer ${token}` } }),
      API.get(`/users/${userId}/comments/count`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    return { votes: votes.data.count || 0, comments: comments.data.count || 0 };
  } catch (err) {
    return rejectWithValue('Failed to fetch stats');
  }
});

// Update user profile (username only, but must send email too)
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ username, email }, { dispatch, getState, rejectWithValue }) => {
    const token = localStorage.getItem('token');
    try {
      await API.put('/profile', { username, email }, { headers: { Authorization: `Bearer ${token}` } });
      // Update auth slice and localStorage for Navbar
      const user = { ...getState().auth.user, username };
      dispatch(setCredentials({ user, token }));
      localStorage.setItem('username', username);
      // Return the new username so we can update profile state too
      return { username };
    } catch (err) {
      return rejectWithValue('Failed to update profile');
    }
  }
);

// Delete user profile
export const deleteProfile = createAsyncThunk('profile/deleteProfile', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    await API.delete('/profile', { headers: { Authorization: `Bearer ${token}` } });
    return true;
  } catch (err) {
    return rejectWithValue('Failed to delete profile');
  }
});

const initialState = {
  profile: null,
  userPosts: [],
  userStats: { votes: 0, comments: 0 },
  updateMessage: '',
  deleting: false,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.userPosts = action.payload;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.userStats = action.payload;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateMessage = "Profile updated successfully";
        // Update the username in the profile state
        if (state.profile) {
          state.profile.username = action.payload.username;
        }
      })
      .addCase(deleteProfile.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteProfile.fulfilled, (state) => {
        state.deleting = false;
      })
      .addCase(deleteProfile.rejected, (state) => {
        state.deleting = false;
      });
  },
});

export default profileSlice.reducer;
