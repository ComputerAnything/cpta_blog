import { useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useAppDispatch } from './redux/hooks'
import { setCredentials, setGuest, setHydrated } from './redux/slices/authSlice'
import Navbar from './components/layout/Navbar'

// Placeholder components - we'll migrate these next
const Footer = () => <div>Footer</div>
const LoadingScreen = () => <div>Loading...</div>
const LandingPage = () => <div>Landing Page</div>
const BlogList = () => <div>Blog List</div>
const PostDetail = () => <div>Post Detail</div>
const CreatePost = () => <div>Create Post</div>
const EditPost = () => <div>Edit Post</div>
const Profile = () => <div>Profile</div>
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => <>{children}</>

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
      <LoadingScreen />
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes */}
        <Route path="/posts" element={<ProtectedRoute><BlogList /></ProtectedRoute>} />
        <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/edit-post/:postId" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
        <Route path="/posts/:postId?" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Error Route */}
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
