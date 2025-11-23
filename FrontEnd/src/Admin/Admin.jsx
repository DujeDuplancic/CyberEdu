import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Users, Flag, BookOpen, MessageSquare, Plus, Edit, Trash2, Shield, ShieldOff } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function AdminPage() {
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", icon: Users, change: "+0%" },
    { label: "Active Challenges", value: "0", icon: Flag, change: "+0" },
    { label: "Total Lectures", value: "0", icon: BookOpen, change: "+0" },
    { label: "Forum Posts", value: "0", icon: MessageSquare, change: "+0" },
  ])
  const [users, setUsers] = useState([])
  const [activeTab, setActiveTab] = useState("users")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        navigate('/login')
        return
      }

      const user = JSON.parse(userData)
      
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/check_admin.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message)
        navigate('/')
        return
      }

      // Ako je admin, učitaj podatke
      loadDashboardStats()
      loadUsers()

    } catch (error) {
      console.error('Admin check error:', error)
      setError("Greška pri provjeri administratorskih prava")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/stats.php')
      const data = await response.json()

      if (data.success) {
        setStats([
          { label: "Total Users", value: data.stats.total_users.toString(), icon: Users, change: "+12%" },
          { label: "Active Challenges", value: data.stats.total_challenges.toString(), icon: Flag, change: "+3" },
          { label: "Total Lectures", value: data.stats.total_lectures.toString(), icon: BookOpen, change: "+2" },
          { label: "Forum Posts", value: data.stats.total_posts.toString(), icon: MessageSquare, change: "+456" },
        ])
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/users.php')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_admin',
          user_id: userId,
          admin_status: !currentStatus
        })
      })

      const data = await response.json()

      if (data.success) {
        // Ažuriraj lokalno stanje
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, is_admin: !currentStatus }
            : user
        ))
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error toggling admin:', error)
      alert('Greška pri promjeni admin statusa')
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Jesi li siguran da želiš obrisati korisnika "${username}"?`)) {
      return
    }

    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/users.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: userId
        })
      })

      const data = await response.json()

      if (data.success) {
        // Ukloni korisnika iz liste
        setUsers(users.filter(user => user.id !== userId))
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Greška pri brisanju korisnika')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">Provjera administratorskih prava...</div>
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage users, challenges, content, and platform settings.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 p-1 bg-muted rounded-lg">
          {["users", "challenges", "content", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage registered users and permissions</CardDescription>
                  </div>
                  <Button onClick={() => loadUsers()}>
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{user.username}</p>
                          {user.is_admin && (
                            <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-md">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(user.created_at).toLocaleDateString()} • 
                          Points: {user.points} • 
                          Rank: #{user.rank}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        >
                          {user.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          {user.is_admin ? ' Remove Admin' : ' Make Admin'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Challenge Management</CardTitle>
                  <CardDescription>Create and manage CTF challenges</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Challenge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Challenge management interface coming soon...</p>
            </CardContent>
          </Card>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>Manage lectures, wiki articles, and educational content</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content management interface coming soon...</p>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings interface coming soon...</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}