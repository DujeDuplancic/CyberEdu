import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./Homepage/Homepage"
import Leaderboard from "./Leaderboard/Leaderboard"
import Profile from "./Profile/Profile"
import Login from "./Login/Login";
import Register from "./Register/Register";
import Contact from "./Contact/Contact";
import Admin from "./Admin/Admin";
import Wiki from "./Wiki/Wiki";
import CTFPage from "./CTF/Ctf";
import Community from "./Community/Community";
import Lectures from "./Lectures/Lectures";
import AboutPage from "./About/About"


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ctf" element={<CTFPage />} />
        <Route path="/ctf/:category" element={<CTFPage />} />
        <Route path="/lectures" element={<Lectures />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/leaderboard" element={<Leaderboard/>} />
        <Route path="/wiki" element={<Wiki/>} />
        <Route path="/community" element={<Community/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/admin" element={<Admin/>} />
      </Routes>
    </Router>
  )
}

export default App