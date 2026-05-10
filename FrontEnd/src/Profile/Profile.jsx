import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Button } from "../Components/ui/button"
import { 
  Trophy, Target, Award, Calendar, 
  TrendingUp, Edit3, CheckCircle2, 
  Search, ShieldAlert 
} from "lucide-react"
import { EditProfileModal } from "../Profile/EditProfileModal"

export default function ProfilePage() {
  const [userStats, setUserStats] = useState(null)
  const [recentSolves, setRecentSolves] = useState([])
  const [categoryProgress, setCategoryProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
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
      setError("Server error while fetching data.")
    } finally {
      setLoading(false)
    }
  }

  // Loading state with a skeleton feel
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 bg-primary/20 rounded-full animate-bounce" />
        <p className="font-mono tracking-widest uppercase">Loading Profile...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="border-destructive/50 max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-lg font-semibold">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#020817]">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4 md:py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 1. HEADER CARD: Identity and Key Info */}
          <Card className="overflow-hidden border-none shadow-lg bg-white dark:bg-card">
            <div className="h-24 bg-gradient-to-r from-primary/80 to-blue-600" />
            <CardContent className="relative pt-0 pb-6 px-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-10">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-2 ring-primary/10">
                  <AvatarImage 
                    src={userStats?.avatar_url 
                      ? (userStats.avatar_url.startsWith('http') 
                        ? userStats.avatar_url 
                        : `http://localhost/CyberEdu/Backend/${userStats.avatar_url}`)
                      : ""} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                    {userStats?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-extrabold tracking-tight">{userStats?.username}</h1>
                    <Badge variant="outline" className="px-3 py-1 text-sm border-primary/30 bg-primary/5 text-primary">
                      Rank #{userStats?.rank}
                    </Badge>
                    {userStats?.is_admin && (
                      <Badge variant="destructive" className="animate-pulse">ADMIN</Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Member since {userStats?.joinedDate}</span>
                    <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Last active: {userStats?.lastActive}</span>
                  </div>
                </div>

                <Button onClick={() => setIsEditModalOpen(true)} className="gap-2 shadow-sm">
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. STATS GRID: Quick Look */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Global Rank", val: `#${userStats?.rank}`, icon: Trophy, color: "text-yellow-500" },
              { label: "Total Points", val: userStats?.points, icon: Target, color: "text-blue-500" },
              { label: "Solved Challenges", val: userStats?.solves, icon: CheckCircle2, color: "text-green-500" },
              { label: "Last Activity", val: userStats?.lastActive, icon: Calendar, color: "text-purple-500" },
            ].map((stat, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-default group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold tracking-tight">{stat.val}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* 3. CATEGORY PROGRESS (Left - 2/3 width) */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Category Progress</CardTitle>
                  <p className="text-sm text-muted-foreground">Skill overview across different domains</p>
                </div>
                <Award className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-7">
                {categoryProgress.map((cat, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold tracking-wide uppercase text-xs text-slate-600 dark:text-slate-400">
                        {cat.name}
                      </span>
                      <span className="font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                        {cat.solved} / {cat.total}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 4. RECENT SOLVES (Right - 1/3 width) */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" /> Recent Victories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSolves.length > 0 ? (
                    recentSolves.map((solve, i) => (
                      <div key={i} className="flex flex-col p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-primary/20 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-bold text-sm leading-tight">{solve.challenge}</p>
                          <Badge className="text-[10px] h-5" variant="secondary">+{solve.points}</Badge>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-tighter">
                            {solve.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {solve.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                      <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">No challenges solved yet.</p>
                      <Button variant="link" size="sm" onClick={() => navigate('/ctf')}>
                        Get started →
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Edit Modal with onUpdate callback for refresh without page reload */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        userData={userStats} 
        onUpdate={fetchProfileData} 
      />
    </div>
  )
}