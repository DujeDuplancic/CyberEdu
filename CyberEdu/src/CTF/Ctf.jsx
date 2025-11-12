import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Search, Filter } from "lucide-react"
import { useState } from "react"
import { useEffect } from "react"
export default function CTFPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const challenges = [
    {
      id: 1,
      title: "Buffer Overflow Basics",
      category: "Binary Exploitation",
      difficulty: "Easy",
      points: 100,
      solves: 234,
    },
    { id: 2, title: "RSA Decryption", category: "Cryptography", difficulty: "Medium", points: 250, solves: 87 },
    { id: 3, title: "Hidden Pixels", category: "Steganography", difficulty: "Easy", points: 150, solves: 156 },
    { id: 4, title: "SQL Injection Lab", category: "Web", difficulty: "Medium", points: 200, solves: 123 },
    { id: 5, title: "Reverse Me", category: "Reverse Engineering", difficulty: "Hard", points: 400, solves: 34 },
    { id: 6, title: "XSS Playground", category: "Web", difficulty: "Easy", points: 100, solves: 289 },
    { id: 7, title: "AES CBC Attack", category: "Cryptography", difficulty: "Hard", points: 500, solves: 21 },
    { id: 8, title: "ELF Crackme", category: "Reverse Engineering", difficulty: "Medium", points: 300, solves: 67 },
  ]

  const [activeCategory, setActiveCategory] = useState("all")

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Hard":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const filteredChallenges = challenges.filter(challenge => 
    activeCategory === "all" || challenge.category.toLowerCase().includes(activeCategory.toLowerCase())
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">CTF Challenges</h1>
          <p className="text-lg text-muted-foreground">
            Solve challenges, capture flags, and earn points to climb the leaderboard.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search challenges..." className="pl-9" />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "reverse", "binary", "crypto", "stego", "web"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                activeCategory === category 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category === "all" ? "All" : 
               category === "reverse" ? "Reverse Engineering" :
               category === "binary" ? "Binary Exploitation" :
               category === "crypto" ? "Cryptography" :
               category === "stego" ? "Steganography" :
               "Web Security"}
            </button>
          ))}
        </div>

        {/* Challenges List */}
        <div className="space-y-4">
          {filteredChallenges.map((challenge) => (
            <Card key={challenge.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl">{challenge.title}</CardTitle>
                    <CardDescription>{challenge.category}</CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(challenge.difficulty)} variant="outline">
                    {challenge.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span className="font-mono font-semibold text-primary">{challenge.points} pts</span>
                    <span>{challenge.solves} solves</span>
                  </div>
                  <Button>Attempt Challenge</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}