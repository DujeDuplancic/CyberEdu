import { Link } from "react-router-dom"
import {
  Terminal, Menu, X, Trophy, Bot, Newspaper, MessageSquare,
  Flag, BarChart3, BookOpen, GraduationCap, Users, Info, ShieldAlert
} from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect, useRef } from "react"

// Endpoint koji vraća broj nepročitanih chat poruka za prijavljenog korisnika
const UNREAD_URL = "http://localhost/CyberEdu/Backend/chat/unread_count.php"
// Polling interval - dovoljno često da se točkica pojavi brzo, a da ne tuče bazu
const UNREAD_POLL_MS = 10000

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  // Broj nepročitanih poruka - koristi se za prikaz plave točkice na Chat linku
  const [unreadCount, setUnreadCount] = useState(0)
  // Ref za interval kako bismo ga mogli ispravno cleanup-ati
  const pollRef = useRef(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  // Dohvat broja nepročitanih poruka + polling. Aktivira se samo kad korisnik
  // postoji - inače nema smisla zvati endpoint.
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0)
      return
    }

    const fetchUnread = async () => {
      try {
        const res = await fetch(`${UNREAD_URL}?user_id=${encodeURIComponent(user.id)}`)
        const data = await res.json()
        if (res.ok && data.success) {
          setUnreadCount(data.unread_count || 0)
        }
      } catch (err) {
        // Tiho ignoriramo greške - point notifikacije nije kritični feature
        console.error("Failed to fetch unread count:", err)
      }
    }

    fetchUnread()
    pollRef.current = setInterval(fetchUnread, UNREAD_POLL_MS)

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setUnreadCount(0)
    setIsMenuOpen(false)
  }

  // Plava točkica - mali kružić koji se pojavljuje preko ikone Chat linka
  // kad postoji barem jedna nepročitana poruka.
  const UnreadDot = () => (
    <span
      className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-background"
      aria-label={`${unreadCount} unread messages`}
      title={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
    />
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <span className="font-mono text-xl font-bold">CyberEdu</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/ctf" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <Flag className="h-4 w-4" />
            CTF
          </Link>
          <Link to="/leaderboard" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link to="/wiki" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            Wiki
          </Link>
          <Link to="/lectures" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            Lectures
          </Link>
          <Link to="/community" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <Users className="h-4 w-4" />
            Community
          </Link>

          {/* Link na agregator vijesti iz svijeta cyber sigurnosti */}
          <Link to="/news" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <Newspaper className="h-4 w-4" />
            News
          </Link>

          {user && (
            <Link to="/achievements" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Achievements
            </Link>
          )}

          {/* Link na SentinelAI asistenta - prikazuje se samo prijavljenim korisnicima */}
          {user && (
            <Link to="/assistant" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
              <Bot className="h-4 w-4" />
              AI Assistant
            </Link>
          )}

          {/* Link na chat sučelje - dostupno samo prijavljenim korisnicima.
              Ikona dobiva plavu točkicu kad postoje nepročitane poruke. */}
          {user && (
            <Link to="/chat" className="relative text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
              <span className="relative inline-flex">
                <MessageSquare className="h-4 w-4" />
                {unreadCount > 0 && <UnreadDot />}
              </span>
              Chat
            </Link>
          )}

          <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
            <Info className="h-4 w-4" />
            About
          </Link>

          {/* POPRAVAK: Dodan !! ispred user?.is_admin da se izbjegne ispis nule */}
          {!!user?.is_admin && (
            <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary text-red-500 font-bold flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost">
                <Link to="/profile">{user.username}</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link to="/register">Sign Up</Link>
              </Button>
              <Button asChild>
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 relative"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          {/* Točkica i na hamburger ikoni kako bi se znalo da postoje nepročitane */}
          {user && unreadCount > 0 && !isMenuOpen && <UnreadDot />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto py-4 px-4 space-y-4">
            <nav className="space-y-3">
              <Link
                to="/ctf"
                className="text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Flag className="h-4 w-4" />
                CTF
              </Link>
              <Link
                to="/leaderboard"
                className="text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link
                to="/wiki"
                className="text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Wiki
              </Link>
              <Link
                to="/lectures"
                className="text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <GraduationCap className="h-4 w-4" />
                Lectures
              </Link>
              <Link
                to="/community"
                className="text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                Community
              </Link>

              {/* News link u mobilnom izborniku */}
              <Link
                to="/news"
                className="block text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Newspaper className="h-4 w-4" />
                News
              </Link>

              {user && (
                <Link
                  to="/achievements"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Trophy className="h-4 w-4" />
                  Achievements
                </Link>
              )}

              {/* Link na SentinelAI asistenta u mobilnom izborniku */}
              {user && (
                <Link
                  to="/assistant"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bot className="h-4 w-4" />
                  AI Assistant
                </Link>
              )}

              {/* Chat link u mobilnom izborniku - s plavom točkicom kad ima nepročitanih */}
              {user && (
                <Link
                  to="/chat"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2 relative"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="relative inline-flex">
                    <MessageSquare className="h-4 w-4" />
                    {unreadCount > 0 && <UnreadDot />}
                  </span>
                  Chat
                </Link>
              )}

              <Link
                to="/about"
                className="text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Info className="h-4 w-4" />
                About
              </Link>

              {/* POPRAVAK: Isto i ovdje za mobilni meni */}
              {!!user?.is_admin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium transition-colors hover:text-primary py-2 text-red-500 font-bold flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>

            <div className="pt-4 border-t border-border space-y-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block text-sm font-medium text-center py-2 border border-border rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile ({user.username})
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      Log In
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
