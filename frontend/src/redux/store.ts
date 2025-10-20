import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import blogReducer from './slices/blogSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    blog: blogReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
