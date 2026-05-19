import { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Navbar from './components/Navbar'
import Contact from './pages/Contact'
import Courses from './pages/Courses'
import Faculty from './pages/Faculty'
import { ArrowUp } from 'lucide-react'
import CourseDetail from './pages/CourseDetail'
import MyCoursespage from './pages/MyCoursesPage'
import CourseDetailPageHome from './pages/CourseDetailPageHome'
import VerifyPaymentPage from '../VerifyPaymentPage'
import { useUser } from '@clerk/clerk-react'


const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser()
  const location = useLocation()
  if (!isLoaded) return null
  if (!isSignedIn) {
    return <Navigate to="/" state={{ from: location }} replace />
  }
  return children
}


const Scroll = () => {
  const location = useLocation()
  useEffect(() => {
    window.scroll({ top: 0, left: 0, behavior: 'auto' })
  }, [location])
  return null
}

const ScrollButton = ({ threshold = 200, showOnMount = false }) => {
  const [visible, setVisible] = useState(!!showOnMount)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  const scrollTop = () => {
    window.scroll({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollTop}
      className="fixed z-50 p-2 rounded-full right-5 bottom-5"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}

function App() {
  const location = useLocation()

  return (
    <>
      {!location.pathname.startsWith('/course/') && <Navbar />}
      <Scroll />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faculty" element={<Faculty />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/mycourses" element={<MyCoursespage />} />
   
        <Route
          path="/course/:id"
          element={
            <ProtectedRoute>
              <CourseDetailPageHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/booking/success" element={<VerifyPaymentPage />} />
        <Route path="/booking/cancel" element={<VerifyPaymentPage />} />
      </Routes>
      <ScrollButton threshold={250} />
    </>
  )
}

export default App