import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isGuest: false,
  loading: false,
  modal: null, // 'login', 'register', or null
  hydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isGuest = false;
      state.modal = null;
      state.hydrated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = false;
      state.modal = null;
      state.hydrated = true;
    },
    setGuest: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = true;
      state.modal = null;
      state.hydrated = true;
    },
    setHydrated: (state) => {
      state.hydrated = true;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    openModal: (state, action) => {
      state.modal = action.payload; // 'login' or 'register'
    },
    closeModal: (state) => {
      state.modal = null;
    },
  },
});

export const {
  setCredentials,
  logout,
  setGuest,
  setLoading,
  openModal,
  closeModal,
  setHydrated,
} = authSlice.actions;
export default authSlice.reducer;
