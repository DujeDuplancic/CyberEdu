import { Link } from "react-router-dom"
import { Terminal } from "lucide-react"
import { Button } from "./ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <span className="font-mono text-xl font-bold">CyberEdu</span>
        </Link>

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
        </nav>

        <Button asChild>
          <Link to="/login">Log In</Link>
        </Button>
      </div>
    </header>
  )
}