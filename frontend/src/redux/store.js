import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import blogReducer from './slices/blogSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer,
  },
});
