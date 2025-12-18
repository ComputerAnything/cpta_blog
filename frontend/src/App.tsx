import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import ScrollToTop from './components/layout/ScrollToTop'
import BlogListPage from './components/features/blog/pages/BlogListPage'
import PostDetailPage from './components/features/blog/pages/PostDetailPage'
import CreatePostPage from './components/features/blog/pages/CreatePostPage'
import EditPostPage from './components/features/blog/pages/EditPostPage'
import ProfilePage from './components/features/blog/pages/ProfilePage'
import ForgotPasswordPage from './components/features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './components/features/auth/pages/ResetPasswordPage'
import VerifyEmailPage from './components/features/auth/pages/VerifyEmailPage'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Navbar />
        <Routes>
          {/* Public Routes - Anyone can view */}
          <Route path="/" element={<BlogListPage />} />
          <Route path="/posts/:postId" element={<PostDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes - Require login */}
          <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="/posts/:postId/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Error Route */}
          <Route path="*" element={<h1>404 Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
