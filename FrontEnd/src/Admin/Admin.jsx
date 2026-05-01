import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Users, Flag, BookOpen, FileText, Trophy } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Import komponenti
import AdminUsers from "./AdminUsers"
import AdminChallenges from "./AdminChallenges"
import AdminWiki from "./Components/AdminWiki"
import AdminContent from "./AdminContent"
import AdminAchievements from "./AdminAchievements"

export default function AdminPage() {
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", icon: Users, change: "+0%" },
    { label: "Active Challenges", value: "0", icon: Flag, change: "+0" },
    { label: "Total Lectures", value: "0", icon: BookOpen, change: "+0" },
    { label: "Wiki Articles", value: "0", icon: FileText, change: "+0" },
    { label: "Achievements", value: "0", icon: Trophy, change: "+0" },
  ])
  const [users, setUsers] = useState([])
  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState("users")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  
  const navigate = useNavigate()

  // 1. Provjera admina pri učitavanju stranice
  useEffect(() => {
    checkAdminAccess()
  }, [])

  // 2. AUTOMATSKI REFRESH: Dohvaćanje podataka čim se promijeni tab
  useEffect(() => {
    if (activeTab === "challenges") {
      loadChallenges()
      if (categories.length === 0) {
        loadCategories()
      }
    } else if (activeTab === "users") {
      loadUsers()
    }
    // Ovdje možeš dodati loadWiki() ili slično ako imaš te funkcije
  }, [activeTab])

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message)
        navigate('/')
        return
      }

      // Inicijalno učitaj statistiku i prvu listu (users)
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
        const wikiCount = data.stats.wiki_articles || 0;
        const achievementsCount = data.stats.total_achievements || 0;
        
        setStats([
          { label: "Total Users", value: data.stats.total_users.toString(), icon: Users, change: "+12%" },
          { label: "Active Challenges", value: data.stats.total_challenges.toString(), icon: Flag, change: "+3" },
          { label: "Total Lectures", value: data.stats.total_lectures.toString(), icon: BookOpen, change: "+2" },
          { label: "Wiki Articles", value: wikiCount.toString(), icon: FileText, change: "+5" },
          { label: "Achievements", value: achievementsCount.toString(), icon: Trophy, change: "+2" },
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
      if (data.success) setUsers(data.users)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadChallenges = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/challenges/get_challenges.php')
      const data = await response.json()
      if (data.success) setChallenges(data.challenges)
    } catch (error) {
      console.error('Error loading challenges:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/challenges/get_categories.php')
      const data = await response.json()
      if (data.success) setCategories(data.categories)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // --- Handleri za akcije (Toggle Admin, Delete, Create, Update, Upload) ---
  // Ostavio sam tvoje originalne funkcije ovdje jer su dobro napisane
  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_admin', user_id: userId, admin_status: !currentStatus })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(users.map(user => user.id === userId ? { ...user, is_admin: !currentStatus ? 1 : 0 } : user))
        setMessage(`✅ ${data.message}`)
      }
    } catch (error) { console.error(error); setMessage("❌ Greška pri promjeni statusa"); }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Jesi li siguran da želiš obrisati korisnika "${username}"?`)) return
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', user_id: userId })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(users.filter(user => user.id !== userId))
        setMessage("✅ Korisnik obrisan uspješno")
      }
    } catch (error) { console.error(error); setMessage("❌ Greška pri brisanju"); }
  }

  const handleCreateChallenge = async (challengeData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/create_challenge.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...challengeData, created_by: user.id })
      })
      const data = await response.json()
      if (data.success) { setMessage("✅ Challenge kreiran!"); return Promise.resolve(); }
      return Promise.reject(new Error(data.message))
    } catch (error) { setMessage("❌ Greška"); return Promise.reject(error); }
  }

  const handleUpdateChallenge = async (challengeData) => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/update_challenge.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData)
      })
      const data = await response.json()
      if (data.success) { setMessage("✅ Challenge ažuriran!"); return Promise.resolve(); }
      return Promise.reject(new Error(data.message))
    } catch (error) { setMessage("❌ Greška"); return Promise.reject(error); }
  }

  const handleDeleteChallenge = async (challengeId, challengeTitle) => {
    if (!confirm(`Obrisati "${challengeTitle}"?`)) return
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/delete_challenge.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: challengeId })
      })
      const data = await response.json()
      if (data.success) {
        setChallenges(challenges.filter(c => c.id !== challengeId))
        setMessage("✅ Challenge obrisan!")
      }
    } catch (error) { setMessage("❌ Greška"); }
  }

  const handleFileUpload = async (file, challengeId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const formData = new FormData()
      formData.append('file', file)
      formData.append('challenge_id', challengeId)
      formData.append('user_id', user.id)

      const response = await fetch('http://localhost/CyberEdu/Backend/utils/upload_file.php', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()

      if (data.success) {
        await fetch('http://localhost/CyberEdu/Backend/admin/update_challenge.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: challengeId, file_url: data.file_url })
        })
        setMessage("✅ File uploaded!")
        loadChallenges()
        return Promise.resolve()
      }
    } catch (error) { setMessage("❌ Upload failed"); return Promise.reject(error); }
  }

  // Clear message timer
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Header /><main className="flex-1 flex items-center justify-center">Provjera...</main><Footer />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col">
      <Header /><main className="flex-1 flex items-center justify-center text-red-500">{error}</main><Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage users, challenges, content, and platform settings.</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md border ${message.includes('✅') ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
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

        {/* Tabovi */}
        <div className="flex space-x-1 mb-6 p-1 bg-muted rounded-lg overflow-x-auto">
          {["users", "challenges", "achievements", "wiki", "content"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dinamički Sadržaj Tabova */}
        {activeTab === "users" && (
          <AdminUsers users={users} onToggleAdmin={handleToggleAdmin} onDeleteUser={handleDeleteUser} onRefresh={loadUsers} />
        )}

        {activeTab === "challenges" && (
          <AdminChallenges challenges={challenges} categories={categories} onRefresh={loadChallenges} onDeleteChallenge={handleDeleteChallenge} onCreateChallenge={handleCreateChallenge} onUpdateChallenge={handleUpdateChallenge} onFileUpload={handleFileUpload} />
        )}

        {activeTab === "achievements" && <AdminAchievements />}
        {activeTab === "wiki" && <AdminWiki />}
        {activeTab === "content" && <AdminContent />}
        
      </main>
      <Footer />
    </div>
  )
}