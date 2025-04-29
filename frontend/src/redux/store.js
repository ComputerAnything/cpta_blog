import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import blogReducer from './slices/blogSlice';
import profileReducer from './slices/profileSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer,
    profile: profileReducer,
  },
});
