import type { User, BlogPost, Comment } from '../types'
import axios from 'axios'

// Create axios instance with base URL
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect for login/auth endpoints - these are expected to return 401 on wrong credentials
      // Also don't redirect for profile check (used by AuthContext)
      const url = error.config?.url || ''
      if (url.includes('/user/profile') ||
          url.includes('/auth/login') ||
          url.includes('/auth/verify-2fa')) {
        return Promise.reject(error)
      }

      // For any other 401, the session has expired mid-action
      // Redirect to home with login modal
      window.location.href = '/?login=true&message=Session expired. Please log in to continue'
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  login: async (identifier: string, password: string, turnstileToken?: string) => {
    const payload: { identifier: string; password: string; turnstile_token?: string } = {
      identifier,
      password
    }
    if (turnstileToken) {
      payload.turnstile_token = turnstileToken
    }
    const response = await api.post('/login', payload)
    // Token is now in httpOnly cookie, just return user data
    return response.data
  },

  register: async (username: string, email: string, password: string, turnstileToken?: string) => {
    const payload: {
      username: string
      email: string
      password: string
      turnstile_token?: string
    } = {
      username,
      email,
      password
    }
    if (turnstileToken) {
      payload.turnstile_token = turnstileToken
    }
    const response = await api.post('/register', payload)
    return response.data
  },

  logout: async () => {
    // Backend should clear the httpOnly cookie
    const response = await api.post('/logout')
    return response.data
  },

  verifyEmail: async (token: string) => {
    const response = await api.get(`/verify-email/${token}`)
    return response.data
  },

  resendVerification: async (identifier: string) => {
    const response = await api.post('/resend-verification', { identifier })
    return response.data
  },

  forgotPassword: async (email: string, firstName: string, lastName: string, turnstileToken: string) => {
    const response = await api.post('/forgot-password', {
      email,
      first_name: firstName,
      last_name: lastName,
      turnstile_token: turnstileToken
    })
    return response.data
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/reset-password', { token, password })
    return response.data
  },

  toggle2FA: async (enable: boolean) => {
    const response = await api.post('/toggle-2fa', { enable })
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  },

  verify2FA: async (email: string, code: string) => {
    const response = await api.post('/verify-2fa', { email, code })
    return response.data
  },

  verifyRegistration: async (email: string, code: string) => {
    const response = await api.post('/verify-registration', { email, code })
    return response.data
  },
}

// Blog API calls
export const blogAPI = {
  getAllPosts: async () => {
    const response = await api.get<BlogPost[]>('/posts')
    return response.data
  },

  getPost: async (postId: number) => {
    const response = await api.get<BlogPost>(`/posts/${postId}`)
    return response.data
  },

  createPost: async (title: string, content: string, topic_tags?: string) => {
    const response = await api.post<BlogPost>('/posts', { title, content, topic_tags })
    return response.data
  },

  updatePost: async (postId: number, title: string, content: string, topic_tags?: string) => {
    const response = await api.put<BlogPost>(`/posts/${postId}`, { title, content, topic_tags })
    return response.data
  },

  deletePost: async (postId: number) => {
    const response = await api.delete(`/posts/${postId}`)
    return response.data
  },

  upvotePost: async (postId: number): Promise<{ upvotes: number; downvotes: number }> => {
    const response = await api.post<{ upvotes: number; downvotes: number }>(`/posts/${postId}/upvote`)
    return response.data
  },

  downvotePost: async (postId: number): Promise<{ upvotes: number; downvotes: number }> => {
    const response = await api.post<{ upvotes: number; downvotes: number }>(`/posts/${postId}/downvote`)
    return response.data
  },
}

// Comment API calls
export const commentAPI = {
  getComments: async (postId: number) => {
    const response = await api.get<Comment[]>(`/posts/${postId}/comments`)
    return response.data
  },

  createComment: async (postId: number, content: string) => {
    const response = await api.post<Comment>(`/posts/${postId}/comments`, { content })
    return response.data
  },

  deleteComment: async (postId: number, commentId: number) => {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`)
    return response.data
  },
}

// User API calls
export const userAPI = {
  getProfile: async () => {
    const response = await api.get<User>('/profile')
    return response.data
  },

  getAllUsers: async (search?: string, page: number = 1, perPage: number = 100) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    params.append('page', page.toString())
    params.append('per_page', perPage.toString())

    const response = await api.get<{
      users: User[]
      total: number
      pages: number
      current_page: number
    }>(`/users?${params.toString()}`)
    return response.data
  },

  getUserByUsername: async (username: string) => {
    const response = await api.get<User>(`/users/${username}`)
    return response.data
  },

  getUserPosts: async (username: string) => {
    const response = await api.get<BlogPost[]>(`/users/${username}/posts`)
    return response.data
  },

  updateProfile: async (username: string, email: string) => {
    const response = await api.put('/profile', { username, email })
    return response.data
  },

  deleteProfile: async () => {
    const response = await api.delete('/profile')
    return response.data
  },
}

export default api
