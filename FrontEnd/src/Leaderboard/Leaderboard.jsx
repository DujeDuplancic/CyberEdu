import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Trophy, Medal, Award, Loader2, Filter, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function LeaderboardPage() {
  const [topUsers, setTopUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const API_BASE = 'http://localhost/CyberEdu/Backend/'

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0) {
      fetchLeaderboard()
    }
  }, [selectedCategory, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}challenges/get_categories.php`)
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      } else {
        setError(`Failed to load categories: ${data.message}`)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setError('Error loading categories')
    }
  }

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    
    try {
      let url = `${API_BASE}leaderboard/get_leaderboard.php`
      const params = new URLSearchParams()
      
      if (selectedCategory && selectedCategory > 0) {
        params.append('category_id', selectedCategory)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        const users = data.leaderboard || []
        setTopUsers(users.slice(0, 3))
        setAllUsers(users.slice(3))
      } else {
        setError(data.message || 'Failed to load leaderboard')
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError('Error loading leaderboard data')
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

  if (loading && !categories.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Loading leaderboard...</p>
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

        {/* Category Filter */}
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
          {selectedCategory && (
            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              <span>Showing results for:</span>
              <Badge variant="outline" className="font-normal">
                {categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'}
              </Badge>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-primary hover:underline text-xs"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">{error}</p>
                  <button 
                    onClick={fetchLeaderboard}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading leaderboard data...</p>
          </div>
        ) : (
          <>
            {/* Top 3 Users */}
            {topUsers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3 mb-8">
                {topUsers.map((user, idx) => (
                  <Card key={user.id || user.username} className="relative overflow-hidden border-primary/20">
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
                          <AvatarFallback>
                            {user.username ? user.username[0].toUpperCase() : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{user.username || "Unknown"}</CardTitle>
                          <p className="text-sm text-muted-foreground">{user.total_solves} solves</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-8">
                <p className="text-muted-foreground">
                  No users found for this category. Be the first to solve challenges!
                </p>
              </div>
            )}

            {/* All Other Users */}
            {(topUsers.length > 0 || allUsers.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>All Rankings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Showing {topUsers.length + allUsers.length} user{topUsers.length + allUsers.length !== 1 ? 's' : ''}
                    {selectedCategory && ` in "${categories.find(c => c.id === selectedCategory)?.name || 'selected category'}"`}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allUsers.length > 0 ? (
                      allUsers.map((user) => (
                        <div
                          key={user.id || `user-${user.rank}`}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 flex justify-center">
                              {getRankIcon(user.rank)}
                            </div>
                            <Avatar>
                              <AvatarImage src={user.profile_image || "/placeholder.svg"} />
                              <AvatarFallback>
                                {user.username ? user.username[0].toUpperCase() : "U"}
                              </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{user.username || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.total_solves} challenge{user.total_solves !== 1 ? 's' : ''} solved
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {user.total_points} pts
                      </Badge>
                    </div>
                  ))
                ) : topUsers.length > 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No other users in this category
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    )}
  </main>

  <Footer />
</div>
)
}