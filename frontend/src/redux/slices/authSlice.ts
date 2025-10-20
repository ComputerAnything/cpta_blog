import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { AuthState, User } from '../../types'

const initialState: AuthState = {
  user: null,
  token: null,
  isGuest: false,
  loading: false,
  modal: null,
  hydrated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isGuest = false
      state.modal = null
      state.hydrated = true
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isGuest = false
      state.modal = null
      state.hydrated = true
    },
    setGuest: (state) => {
      state.user = null
      state.token = null
      state.isGuest = true
      state.modal = null
      state.hydrated = true
    },
    setHydrated: (state) => {
      state.hydrated = true
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    openModal: (state, action: PayloadAction<'login' | 'register' | 'forgotPassword'>) => {
      state.modal = action.payload
    },
    closeModal: (state) => {
      state.modal = null
    },
  },
})

export const {
  setCredentials,
  logout,
  setGuest,
  setLoading,
  openModal,
  closeModal,
  setHydrated,
} = authSlice.actions

export default authSlice.reducer
