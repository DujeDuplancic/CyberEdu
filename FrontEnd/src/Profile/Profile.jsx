import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Button } from "../Components/ui/button"
import { Trophy, Target, Clock, Award, Calendar, TrendingUp, User } from "lucide-react"
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
        // Formatiraj datume
        const formattedStats = {
          ...data.profile,
          // Ako je last_active timestamp, formatiraj ga
          lastActive: formatLastActive(data.profile.last_active),
          // Ako je created_at, formatiraj kao datum pridruživanja
          joinedDate: formatDate(data.profile.created_at || data.profile.joined_date)
        }
        
        setUserStats(formattedStats)
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

  // Funkcija za formatiranje "last active" vremena
  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Recently";
    
    try {
      const now = new Date();
      const lastActive = new Date(timestamp);
      const diffInSeconds = Math.floor((now - lastActive) / 1000);
      
      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
      
      return lastActive.toLocaleDateString();
    } catch (e) {
      return "Recently";
    }
  }

  // Funkcija za formatiranje datuma
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  }

  // Formatiraj vrijeme za recent solves
  const formatSolveTime = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        if (diffInHours < 1) return "Just now";
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      }
      
      return date.toLocaleDateString();
    } catch (e) {
      return timestamp;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Učitavanje profila...</p>
          </div>
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
                    {userStats.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{userStats.username || "User"}</h1>
                    <Badge variant="secondary">Rank #{userStats.rank || "N/A"}</Badge>
                    {userStats.is_admin && <Badge variant="destructive">Admin</Badge>}
                  </div>
                  <p className="text-muted-foreground mb-4 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Member since {userStats.joinedDate || "N/A"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Last active {userStats.lastActive || "Recently"}
                    </span>
                  </p>
                  <div className="flex gap-6">
                    <div>
                      <div className="text-2xl font-bold text-primary">{userStats.points || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{userStats.solves || 0}</div>
                      <div className="text-sm text-muted-foreground">Challenges Solved</div>
                    </div>
                  </div>
                </div>
                <Button variant="outline">Edit Profile</Button>
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
                <div className="text-2xl font-bold">#{userStats.rank || "N/A"}</div>
                <p className="text-xs text-muted-foreground mt-1">Global ranking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Points</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.points || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Solves</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.solves || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Challenges completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.lastActive || "Recently"}</div>
                <p className="text-xs text-muted-foreground mt-1">Last active</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Progress - samo ako postoji */}
          {categoryProgress && categoryProgress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Category Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryProgress.map((category, index) => (
                  <div key={category.name || index}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{category.name || "Category"}</span>
                      <span className="text-sm text-muted-foreground">
                        {category.solved || 0} / {category.total || 0}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ 
                          width: `${category.percentage || 0}%` 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Solves */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Solves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSolves && recentSolves.length > 0 ? (
                  recentSolves.map((solve, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{solve.challenge || "Challenge"}</p>
                        <p className="text-sm text-muted-foreground">{solve.category || "Category"}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {solve.points || 0} pts
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatSolveTime(solve.time || solve.solved_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No challenges solved yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start your CTF journey by solving some challenges!
                    </p>
                    <Button onClick={() => navigate('/ctf')}>
                      Browse Challenges
                    </Button>
                  </div>
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