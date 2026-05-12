import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import HomePage from "./Homepage/Homepage"
import Leaderboard from "./Leaderboard/Leaderboard"
import Profile from "./Profile/Profile"
import Login from "./Login/Login";
import Register from "./Register/Register";
import Contact from "./Contact/Contact";
import Admin from "./Admin/Admin";
import Wiki from "./Wiki/Wiki";
import WikiCategory from "./Wiki/WikiCategory";
import WikiArticle from "./Wiki/WikiArticle";
import CTFPage from "./CTF/Ctf";
import Community from "./Community/Community";
import Lectures from "./Lectures/Lectures";
import LectureDetail from "./Lectures/LectureDetail";
import AboutPage from "./About/About"
import DiscussionDetail from './Community/DiscussionDetail';
import CreateDiscussion from './Community/CreateDiscussion';
import AchievementsPage from './Achievements/AchievementsPage';
import AssistantPage from './Assistant/Assistant';
import { NotificationProvider } from './contexts/NotificationContext';

// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public Route Component (only accessible when not logged in)
function PublicRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

// Admin Route Component
function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        setIsAdmin(!!userData.is_admin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAdmin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <NotificationProvider> 
      <Router>
        <Routes>
          {/* Public Routes - Always accessible */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          
          {/* Auth Routes - Only accessible when NOT logged in */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Protected Routes - Only accessible when logged in */}
          <Route path="/ctf" element={
            <ProtectedRoute>
              <CTFPage />
            </ProtectedRoute>
          } />
          <Route path="/ctf/:category" element={
            <ProtectedRoute>
              <CTFPage />
            </ProtectedRoute>
          } />
          <Route path="/lectures" element={
            <ProtectedRoute>
              <Lectures />
            </ProtectedRoute>
          } />
          <Route path="/lectures/:id" element={
            <ProtectedRoute>
              <LectureDetail />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          } />
          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          } />
          <Route path="/wiki" element={
            <ProtectedRoute>
              <Wiki />
            </ProtectedRoute>
          } />
          <Route path="/wiki/:category" element={
            <ProtectedRoute>
              <WikiCategory />
            </ProtectedRoute>
          } />
          <Route path="/wiki/:category/:articleSlug" element={
            <ProtectedRoute>
              <WikiArticle />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/achievements" element={
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
          } />
          <Route path="/assistant" element={
            <ProtectedRoute>
              <AssistantPage />
            </ProtectedRoute>
          } />
          <Route path="/community/discussion/:id" element={
            <ProtectedRoute>
              <DiscussionDetail />
            </ProtectedRoute>
          } />
          <Route path="/community/new" element={
            <ProtectedRoute>
              <CreateDiscussion />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - Only accessible when logged in as admin */}
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Routes>
      </Router>
    </NotificationProvider>
  )
}

export default App