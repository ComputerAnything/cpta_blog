import { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useAppDispatch } from './redux/hooks'
import { setCredentials, setGuest, setHydrated } from './redux/slices/authSlice'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import LoadingScreen from './components/common/LoadingScreen'
import ScrollToTop from './components/common/ScrollToTop'
import LandingPage from './components/landing/LandingPage'
import ProtectedRoute from './components/common/ProtectedRoute'
import BlogList from './components/blog/BlogList'
import PostDetail from './components/blog/PostDetail'
import CreatePost from './components/blog/CreatePost'
import EditPost from './components/blog/EditPost'
import Profile from './components/profile/Profile'
import ResetPassword from './components/auth/ResetPassword'
import VerifyEmail from './components/auth/VerifyEmail'

// Hydrate Redux auth state from localStorage on app load
const AuthHydrator = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    const userId = localStorage.getItem('userId')
    const guest = localStorage.getItem('guest')

    if (guest === 'true') {
      dispatch(setGuest())
    } else if (token && username && userId) {
      dispatch(setCredentials({
        user: { id: parseInt(userId), username },
        token,
      }))
    } else {
      dispatch(setHydrated())
    }
  }, [dispatch])

  return null
}

function App() {
  return (
    <Router>
      <AuthHydrator />
      <ScrollToTop />
      <LoadingScreen />
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/posts" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/posts/:postId/edit" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        <Route path="/posts/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Error Route */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
