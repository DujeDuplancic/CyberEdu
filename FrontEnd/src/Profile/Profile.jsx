import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Button } from "../Components/ui/button"
import { Trophy, Target, Clock, Award } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function ProfilePage() {
  const [userStats, setUserStats] = useState(null)
  const [recentSolves, setRecentSolves] = useState([])
  const [categoryProgress, setCategoryProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      // Dobavi user podatke iz localStorage
      const userData = localStorage.getItem('user')
      if (!userData) {
        navigate('/login')
        return
      }

      const user = JSON.parse(userData)
      
      const response = await fetch(`http://localhost/CyberEdu/Backend/profile/get_profile.php?user_id=${user.id}`)
      const data = await response.json()

      if (data.success) {
        setUserStats(data.profile)
        setRecentSolves(data.recentSolves)
        setCategoryProgress(data.categoryProgress)
      } else {
        setError(data.message)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError("Greška pri učitavanju profila")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">Učitavanje profila...</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center text-red-500">{error}</div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!userStats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">
            <p>Nema podataka o korisniku</p>
            <Button onClick={() => navigate('/login')} className="mt-4">
              Prijavi se
            </Button>
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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={userStats.avatar_url || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback className="text-2xl">
                    {userStats.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{userStats.username}</h1>
                    <Badge variant="secondary">Rank #{userStats.rank}</Badge>
                    {userStats.is_admin && <Badge variant="destructive">Admin</Badge>}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Member since {userStats.joinedDate} • Last active {userStats.lastActive}
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <div className="text-2xl font-bold text-primary">{userStats.points}</div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{userStats.solves}</div>
                      <div className="text-sm text-muted-foreground">Challenges Solved</div>
                    </div>
                  </div>
                </div>
                <Button>Edit Profile</Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rank</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{userStats.rank}</div>
                <p className="text-xs text-muted-foreground mt-1">Global ranking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Points</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.points}</div>
                <p className="text-xs text-muted-foreground mt-1">Total earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Solves</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.solves}</div>
                <p className="text-xs text-muted-foreground mt-1">Challenges completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.lastActive}</div>
                <p className="text-xs text-muted-foreground mt-1">Last seen</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Category Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categoryProgress.map((category) => (
                <div key={category.name}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.solved} / {category.total}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${category.percentage}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Solves */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Solves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSolves.length > 0 ? (
                  recentSolves.map((solve, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-semibold">{solve.challenge}</p>
                        <p className="text-sm text-muted-foreground">{solve.category}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {solve.points} pts
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{solve.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No challenges solved yet. Start hacking!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}