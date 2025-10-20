// User types
export interface User {
  id: number
  username: string
  email?: string
  created_at?: string
  is_verified?: boolean
}

// Blog Post types
export interface BlogPost {
  id: number
  title: string
  content: string
  topic_tags?: string | null
  upvotes: number
  downvotes: number
  created_at: string
  user_id: number
  author?: string
}

// Comment types
export interface Comment {
  id: number
  content: string
  user_id: number
  username: string
  post_id: number
  created_at: string
}

// Vote types
export interface Vote {
  id: number
  user_id: number
  post_id: number
  vote_type: 'upvote' | 'downvote'
}

// Auth state types
export interface AuthState {
  user: User | null
  token: string | null
  isGuest: boolean
  loading: boolean
  modal: 'login' | 'register' | 'forgotPassword' | null
  hydrated: boolean
}

// API Response types
export interface LoginResponse {
  access_token: string
  user: User
}

export interface RegisterResponse {
  message: string
}

export interface PostsResponse {
  posts: BlogPost[]
}

export interface PostResponse {
  post: BlogPost
}

export interface CommentsResponse {
  comments: Comment[]
}

// Blog state types
export interface BlogState {
  posts: BlogPost[]
  profiles: User[]
  comments: Comment[]
  loading: boolean
  error: string | null
}
