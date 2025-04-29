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

// Fetch comments for a specific post
export const fetchComments = createAsyncThunk('blog/fetchComments', async (postId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.get(`/posts/${postId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to fetch comments');
  }
});

// Add a comment to a specific post
export const addComment = createAsyncThunk('blog/addComment', async ({ postId, content }, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.post(`/posts/${postId}/comments`, { content }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to add comment');
  }
});

// Delete a comment from a specific post
export const deleteComment = createAsyncThunk('blog/deleteComment', async ({ postId, commentId }, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    await API.delete(`/posts/${postId}/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return commentId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to delete comment');
  }
});

// Upvote a specific post
export const upvotePost = createAsyncThunk('blog/upvotePost', async (postId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.post(`/posts/${postId}/upvote`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { postId, ...response.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to upvote');
  }
});

// Downvote a specific post
export const downvotePost = createAsyncThunk('blog/downvotePost', async (postId, { rejectWithValue }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await API.post(`/posts/${postId}/downvote`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { postId, ...response.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.msg || 'Failed to downvote');
  }
});

const initialState = {
  posts: [],
  profiles: [],
  comments: [],
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
      })
      // Comments
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.comments = [];
        state.error = action.payload || action.error.message;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter(c => c.id !== action.payload);
      });
  },
});

export default blogSlice.reducer;
