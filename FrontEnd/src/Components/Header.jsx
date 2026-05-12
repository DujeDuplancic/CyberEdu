import { Link } from "react-router-dom"
import { Terminal, Menu, X, Trophy, Bot, Newspaper, MessageSquare } from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setIsMenuOpen(false)
  }

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
          <Link to="/ctf" className="text-sm font-medium transition-colors hover:text-primary">
            CTF
          </Link>
          <Link to="/leaderboard" className="text-sm font-medium transition-colors hover:text-primary">
            Leaderboard
          </Link>
          <Link to="/wiki" className="text-sm font-medium transition-colors hover:text-primary">
            Wiki
          </Link>
          <Link to="/lectures" className="text-sm font-medium transition-colors hover:text-primary">
            Lectures
          </Link>
          <Link to="/community" className="text-sm font-medium transition-colors hover:text-primary">
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

          {/* Link na chat sučelje - dostupno samo prijavljenim korisnicima */}
          {user && (
            <Link to="/chat" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          )}

          <Link to="/about" className="text-sm font-medium transition-colors hover:text-primary">
            About
          </Link>
          
          {/* POPRAVAK: Dodan !! ispred user?.is_admin da se izbjegne ispis nule */}
          {!!user?.is_admin && (
            <Link to="/admin" className="text-sm font-medium transition-colors hover:text-primary text-red-500 font-bold">
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
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto py-4 px-4 space-y-4">
            <nav className="space-y-3">
              <Link 
                to="/ctf" 
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                CTF
              </Link>
              <Link 
                to="/leaderboard" 
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              <Link 
                to="/wiki" 
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Wiki
              </Link>
              <Link 
                to="/lectures" 
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Lectures
              </Link>
              <Link
                to="/community"
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
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

              {/* Chat link u mobilnom izborniku */}
              {user && (
                <Link
                  to="/chat"
                  className="block text-sm font-medium transition-colors hover:text-primary py-2 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Link>
              )}

              <Link
                to="/about"
                className="block text-sm font-medium transition-colors hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              {/* POPRAVAK: Isto i ovdje za mobilni meni */}
              {!!user?.is_admin && (
                <Link 
                  to="/admin" 
                  className="block text-sm font-medium transition-colors hover:text-primary py-2 text-red-500 font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
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