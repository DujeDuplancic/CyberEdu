import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Users, Flag, BookOpen, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Import komponenti
import AdminUsers from "./AdminUsers"
import AdminChallenges from "./AdminChallenges"
import AdminContent from "./AdminContent"
import AdminSettings from "./AdminSettings"

export default function AdminPage() {
  const [stats, setStats] = useState([
    { label: "Total Users", value: "0", icon: Users, change: "+0%" },
    { label: "Active Challenges", value: "0", icon: Flag, change: "+0" },
    { label: "Total Lectures", value: "0", icon: BookOpen, change: "+0" },
    { label: "Forum Posts", value: "0", icon: MessageSquare, change: "+0" },
  ])
  const [users, setUsers] = useState([])
  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])
  const [activeTab, setActiveTab] = useState("users")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  
  const navigate = useNavigate()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (activeTab === "challenges" && categories.length === 0) {
      loadCategories()
    }
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

  const loadChallenges = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/challenges/get_challenges.php')
      const data = await response.json()
      
      if (data.success) {
        setChallenges(data.challenges)
      }
    } catch (error) {
      console.error('Error loading challenges:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/challenges/get_categories.php')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
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
        setMessage(`✅ ${data.message}`)
      } else {
        setMessage(`❌ ${data.message}`)
      }
    } catch (error) {
      console.error('Error toggling admin:', error)
      setMessage("❌ Greška pri promjeni admin statusa")
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
        setMessage("✅ Korisnik obrisan uspješno")
      } else {
        setMessage(`❌ ${data.message}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setMessage("❌ Greška pri brisanju korisnika")
    }
  }

  const handleCreateChallenge = async (challengeData) => {
    try {
      const userData = localStorage.getItem('user')
      const user = JSON.parse(userData)

      const response = await fetch('http://localhost/CyberEdu/Backend/admin/create_challenge.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...challengeData,
          created_by: user.id
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Challenge uspješno kreiran!")
        return Promise.resolve()
      } else {
        setMessage(`❌ ${data.message}`)
        return Promise.reject(new Error(data.message))
      }
    } catch (error) {
      console.error('Error creating challenge:', error)
      setMessage("❌ Greška pri kreiranju challengea")
      return Promise.reject(error)
    }
  }

  const handleUpdateChallenge = async (challengeData) => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/update_challenge.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challengeData)
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Challenge uspješno ažuriran!")
        return Promise.resolve()
      } else {
        setMessage(`❌ ${data.message}`)
        return Promise.reject(new Error(data.message))
      }
    } catch (error) {
      console.error('Error updating challenge:', error)
      setMessage("❌ Greška pri ažuriranju challengea")
      return Promise.reject(error)
    }
  }

  const handleDeleteChallenge = async (challengeId, challengeTitle) => {
    if (!confirm(`Jesi li siguran da želiš obrisati challenge "${challengeTitle}"? Ova akcija se ne može poništiti!`)) {
      return
    }

    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/delete_challenge.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: challengeId })
      })

      const data = await response.json()

      if (data.success) {
        // Remove from local state
        setChallenges(challenges.filter(challenge => challenge.id !== challengeId))
        setMessage("✅ Challenge obrisan uspješno!")
      } else {
        setMessage(`❌ ${data.message}`)
      }
    } catch (error) {
      console.error('Error deleting challenge:', error)
      setMessage("❌ Greška pri brisanju challengea")
    }
  }

  const handleFileUpload = async (file, challengeId) => {
  try {
    const userData = localStorage.getItem('user')
    if (!userData) {
      throw new Error('User not logged in')
    }

    const user = JSON.parse(userData)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('challenge_id', challengeId)
    formData.append('user_id', user.id)  // DODAJ OVO

    const response = await fetch('http://localhost/CyberEdu/Backend/utils/upload_file.php', {
      method: 'POST',
      body: formData
      // NE DODAJ headers za Content-Type - FormData ga automatski postavlja
    })

    const data = await response.json()

    if (data.success) {
      // Update challenge with file URL
      const updateResponse = await fetch('http://localhost/CyberEdu/Backend/admin/update_challenge.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: challengeId,
          file_url: data.file_url
        })
      })

      const updateData = await updateResponse.json()
      
      if (updateData.success) {
        setMessage("✅ File uspješno uploadan!")
        loadChallenges()
        return Promise.resolve()
      } else {
        throw new Error(updateData.message)
      }
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    setMessage(`❌ ${error.message}`)
    return Promise.reject(error)
  }
}

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

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

        {/* Global Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('✅') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

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

        {/* Tab Content */}
        {activeTab === "users" && (
          <AdminUsers
            users={users}
            onToggleAdmin={handleToggleAdmin}
            onDeleteUser={handleDeleteUser}
            onRefresh={loadUsers}
          />
        )}

        // U return dijelu, u AdminChallenges komponenti:
{activeTab === "challenges" && (
  <AdminChallenges
    challenges={challenges}
    categories={categories}
    onRefresh={loadChallenges}
    onDeleteChallenge={handleDeleteChallenge}
    onCreateChallenge={handleCreateChallenge}
    onUpdateChallenge={handleUpdateChallenge}
    onFileUpload={handleFileUpload}  // OVO JE KLJUČNO
  />
)}

        {activeTab === "content" && <AdminContent />}
        {activeTab === "settings" && <AdminSettings />}
      </main>

      <Footer />
    </div>
  )
}