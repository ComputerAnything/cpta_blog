import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  isGuest: false,
  loading: false,
  modal: null, // 'login', 'register', or null
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
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = false;
      state.modal = null;
    },
    setGuest: (state) => {
      state.user = null;
      state.token = null;
      state.isGuest = true;
      state.modal = null;
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
} = authSlice.actions;
export default authSlice.reducer;
