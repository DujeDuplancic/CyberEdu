import { Link } from "react-router-dom"
import { Terminal, Menu, X, Trophy } from "lucide-react"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Provjeri da li je korisnik prijavljen
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setIsMenuOpen(false)
    // Možeš dodati redirect na homepage ako želiš
    // window.location.href = '/'
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
          
          {/* Achievements link - samo za prijavljene korisnike */}
          {user && (
            <Link to="/achievements" className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Achievements
            </Link>
          )}
          
          {/* Admin link - samo za prijavljene admin korisnike */}
          {user?.is_admin && (
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
            {/* Mobile Navigation Links */}
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
              
              {/* Achievements link - samo za prijavljene korisnike */}
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
              
              {/* Admin link - samo za prijavljene admin korisnike */}
              {user?.is_admin && (
                <Link 
                  to="/admin" 
                  className="block text-sm font-medium transition-colors hover:text-primary py-2 text-red-500 font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </nav>

            {/* Mobile User Actions */}
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