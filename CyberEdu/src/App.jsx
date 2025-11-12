import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./Homepage/Homepage"
import Leaderboard from "./Leaderboard/Leaderboard"
import Profile from "./Profile/Profile"
import Login from "./Login/Login";

// Placeholder komponente za druge rute
function CTFPage() {
  return <div className="min-h-screen flex items-center justify-center">CTF Page - Coming Soon</div>
}

function LecturesPage() {
  return <div className="min-h-screen flex items-center justify-center">Lectures Page - Coming Soon</div>
}

function RegisterPage() {
  return <div className="min-h-screen flex items-center justify-center">Register Page - Coming Soon</div>
}

function AboutPage() {
  return <div className="min-h-screen flex items-center justify-center">About Page - Coming Soon</div>
}

function ContactPage() {
  return <div className="min-h-screen flex items-center justify-center">Contact Page - Coming Soon</div>
}

function LoginPage() {
  return <div className="min-h-screen flex items-center justify-center">Login Page - Coming Soon</div>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ctf" element={<CTFPage />} />
        <Route path="/ctf/:category" element={<CTFPage />} />
        <Route path="/lectures" element={<LecturesPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leaderboard" element={<Leaderboard/>} />
        <Route path="/wiki" element={<div className="min-h-screen flex items-center justify-center">Wiki - Coming Soon</div>} />
        <Route path="/community" element={<div className="min-h-screen flex items-center justify-center">Community - Coming Soon</div>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/admin" element={<div className="min-h-screen flex items-center justify-center">Admin - Coming Soon</div>} />
      </Routes>
    </Router>
  )
}

export default App