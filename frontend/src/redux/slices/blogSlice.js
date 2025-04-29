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

// Create a new blog post
export const createPost = createAsyncThunk('blog/createPost', async (postData, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.post('/posts', postData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to create post');
  }
});

// Update an existing blog post
export const updatePost = createAsyncThunk('blog/updatePost', async (postData, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.put(`/posts/${postData.id}`, postData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to update post');
  }
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
      })
      // Create Post
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload); // Add new post to the top
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Update Post
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;
        // Update the post in the posts array
        const idx = state.posts.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.posts[idx] = action.payload;
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default blogSlice.reducer;
