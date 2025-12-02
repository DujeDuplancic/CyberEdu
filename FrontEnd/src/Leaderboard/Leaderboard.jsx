import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Trophy, Medal, Award, Loader2, Filter } from "lucide-react"
import { useEffect, useState } from "react"

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchLeaderboard()
  }, [selectedCategory])

  const fetchCategories = async () => {
  try {
    // POKUŠAJ OVAJ URL
    const response = await fetch('/api/challenges/get_categories.php')
    const data = await response.json()
    if (data.success) {
      setCategories(data.categories)
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const fetchLeaderboard = async () => {
  setLoading(true)
  setError(null)
  
  try {
    // POKUŠAJ OVAJ URL
    let url = '/api/leaderboard/get_leaderboard.php'
    if (selectedCategory) {
      url += `?category_id=${selectedCategory}`
    }
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.success) {
      const users = data.leaderboard
      setTopUsers(users.slice(0, 3))
      setAllUsers(users.slice(3))
    } else {
      setError(data.message)
    }
  } catch (error) {
    setError('Greška pri učitavanju leaderboarda')
    console.error('Error fetching leaderboard:', error)
  } finally {
    setLoading(false)
  }
}

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />
      default:
        return <span className="font-mono font-semibold text-muted-foreground">#{rank}</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Učitavam leaderboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
          <p className="text-lg text-muted-foreground">
            Top players ranked by total points earned from solved challenges.
          </p>
        </div>

        {/* Filter za kategorije */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <p className="font-medium">{error}</p>
                <button 
                  onClick={fetchLeaderboard}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Pokušaj ponovo
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 korisnika */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {topUsers.map((user, idx) => (
                <Card key={user.username} className="relative overflow-hidden border-primary/20">
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : "bg-amber-700"
                    }`}
                  />
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      {getRankIcon(user.rank)}
                      <Badge variant="secondary" className="text-sm font-mono">
                        {user.total_points} pts
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profile_image || "/placeholder.svg"} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{user.username}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.total_solves} solves</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Svi ostali korisnici */}
            <Card>
              <CardHeader>
                <CardTitle>All Rankings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Showing {topUsers.length + allUsers.length} users
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 flex justify-center">
                          {getRankIcon(user.rank)}
                        </div>
                        <Avatar>
                          <AvatarImage src={user.profile_image || "/placeholder.svg"} />
                          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.total_solves} challenges solved</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {user.total_points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}