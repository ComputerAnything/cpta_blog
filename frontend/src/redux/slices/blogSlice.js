import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Fetch all blog posts
export const fetchPosts = createAsyncThunk('blog/fetchPosts', async () => {
  const token = localStorage.getItem('token');
  const response = await API.get('/posts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

// Fetch all user profiles
export const fetchProfiles = createAsyncThunk('blog/fetchProfiles', async () => {
  const token = localStorage.getItem('token');
  const response = await API.get('/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Sort by username for consistency
  return response.data.sort((a, b) => a.username.localeCompare(b.username));
});

const initialState = {
  posts: [],
  profiles: [],
  loading: false,
  error: null,
};

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Profiles
      .addCase(fetchProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles = action.payload;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default blogSlice.reducer;
