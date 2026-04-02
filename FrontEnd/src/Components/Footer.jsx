import { Link } from "react-router-dom"
import { Terminal, Github, Twitter, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Left side - About section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-6 w-6 text-primary" />
              <span className="font-mono text-lg font-bold">CyberEdu</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Master cybersecurity through hands-on CTF challenges and comprehensive educational resources.
            </p>
            <div className="flex gap-4">
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          {/* Platform section */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/ctf" className="text-muted-foreground hover:text-primary transition-colors">
                  CTF Challenges
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/lectures" className="text-muted-foreground hover:text-primary transition-colors">
                  Lectures
                </Link>
              </li>
              <li>
                <Link to="/wiki" className="text-muted-foreground hover:text-primary transition-colors">
                  Wiki
                </Link>
              </li>
            </ul>
          </div>

          {/* Community section */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/community" className="text-muted-foreground hover:text-primary transition-colors">
                  Forum
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                  Admin
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources section */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/wiki/reverse-engineering"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Reverse Engineering
                </Link>
              </li>
              <li>
                <Link
                  to="/wiki/binary-exploitation"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Binary Exploitation
                </Link>
              </li>
              <li>
                <Link to="/wiki/cryptography" className="text-muted-foreground hover:text-primary transition-colors">
                  Cryptography
                </Link>
              </li>
              <li>
                <Link to="/wiki/steganography" className="text-muted-foreground hover:text-primary transition-colors">
                  Steganography
                </Link>
              </li>
              <li>
                <Link to="/wiki/web-security" className="text-muted-foreground hover:text-primary transition-colors">
                  Web Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar - Copyright */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CyberEdu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}