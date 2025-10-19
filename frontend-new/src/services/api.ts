import axios from 'axios'
import type {
  LoginResponse,
  RegisterResponse,
  PostsResponse,
  PostResponse,
  CommentsResponse,
  BlogPost,
  Comment,
  User,
} from '../types'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

// Request interceptor to add auth token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth endpoints
export const authAPI = {
  login: (username: string, password: string) =>
    API.post<LoginResponse>('/login', { username, password }),

  register: (username: string, email: string, password: string) =>
    API.post<RegisterResponse>('/register', { username, email, password }),

  verifyEmail: (token: string) =>
    API.get(`/verify-email/${token}`),
}

// Blog endpoints
export const blogAPI = {
  getAllPosts: () =>
    API.get<PostsResponse>('/posts'),

  getPost: (postId: number) =>
    API.get<PostResponse>(`/posts/${postId}`),

  createPost: (title: string, content: string, topic_tags?: string) =>
    API.post<PostResponse>('/posts', { title, content, topic_tags }),

  updatePost: (postId: number, title: string, content: string, topic_tags?: string) =>
    API.put<PostResponse>(`/posts/${postId}`, { title, content, topic_tags }),

  deletePost: (postId: number) =>
    API.delete(`/posts/${postId}`),

  votePost: (postId: number, voteType: 'upvote' | 'downvote') =>
    API.post(`/posts/${postId}/vote`, { vote_type: voteType }),
}

// Comment endpoints
export const commentAPI = {
  getComments: (postId: number) =>
    API.get<CommentsResponse>(`/posts/${postId}/comments`),

  createComment: (postId: number, content: string) =>
    API.post<{ comment: Comment }>(`/posts/${postId}/comments`, { content }),

  deleteComment: (postId: number, commentId: number) =>
    API.delete(`/posts/${postId}/comments/${commentId}`),
}

// User endpoints
export const userAPI = {
  getProfile: (userId?: number) =>
    API.get<{ user: User; posts: BlogPost[] }>(userId ? `/profile/${userId}` : '/profile'),
}

export default API
