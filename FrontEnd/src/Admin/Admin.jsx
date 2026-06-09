import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent } from "../Components/ui/card"
import {
  Users, Flag, BookOpen, FileText, Trophy,
  ShieldCheck, Loader2, AlertTriangle, CheckCircle2, XCircle, LayoutDashboard
} from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Import komponenti
import AdminUsers from "./AdminUsers"
import AdminChallenges from "./AdminChallenges"
import AdminWiki from "./Components/AdminWiki"
import AdminContent from "./AdminContent"
import AdminAchievements from "./AdminAchievements"

// =====================================================================
// Konfiguracija tabova - svaki tab ima labelu, ikonu i jedinstveni ključ.
// Drži tab metadata na jednom mjestu radi lakšeg održavanja.
// =====================================================================
const TABS = [
  { key: "users",        label: "Users",        icon: Users },
  { key: "challenges",   label: "Challenges",   icon: Flag },
  { key: "achievements", label: "Achievements", icon: Trophy },
  { key: "wiki",         label: "Wiki",         icon: FileText },
  { key: "content",      label: "Lectures",     icon: BookOpen }
]

// =====================================================================
// Konfiguracija stat kartica - paleta boja za svaku metriku
// kako bi dashboard izgledao informativno i jasno.
// =====================================================================
const STAT_COLORS = {
  users:        { bg: "bg-indigo-50",  text: "text-indigo-600",  bar: "bg-indigo-500" },
  challenges:   { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
  lectures:     { bg: "bg-blue-50",    text: "text-blue-600",    bar: "bg-blue-500" },
  wiki:         { bg: "bg-amber-50",   text: "text-amber-600",   bar: "bg-amber-500" },
  achievements: { bg: "bg-rose-50",    text: "text-rose-600",    bar: "bg-rose-500" }
}

export default function AdminPage() {
  // Stat objekti sada čuvaju i 'key' za mapiranje boje u STAT_COLORS
  const [stats, setStats] = useState([
    { key: "users",        label: "Total Users",       value: "0", icon: Users },
    { key: "challenges",   label: "Active Challenges", value: "0", icon: Flag },
    { key: "lectures",     label: "Total Lectures",    value: "0", icon: BookOpen },
    { key: "wiki",         label: "Wiki Articles",     value: "0", icon: FileText },
    { key: "achievements", label: "Achievements",      value: "0", icon: Trophy },
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
    // Ostali tabovi učitavaju svoje podatke iz vlastitih komponenti
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
      setError("Error verifying administrator privileges")
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/stats.php')
      const data = await response.json()

      if (data.success) {
        const wikiCount = data.stats.wiki_articles || 0
        const achievementsCount = data.stats.total_achievements || 0

        // Zadržavamo iste ključeve kao i u inicijalnom state-u radi STAT_COLORS mapinga
        setStats([
          { key: "users",        label: "Total Users",       value: data.stats.total_users.toString(),       icon: Users },
          { key: "challenges",   label: "Active Challenges", value: data.stats.total_challenges.toString(),  icon: Flag },
          { key: "lectures",     label: "Total Lectures",    value: data.stats.total_lectures.toString(),    icon: BookOpen },
          { key: "wiki",         label: "Wiki Articles",     value: wikiCount.toString(),                    icon: FileText },
          { key: "achievements", label: "Achievements",      value: achievementsCount.toString(),            icon: Trophy }
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
  // Originalna business logika ostaje netaknuta
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
    } catch (error) { console.error(error); setMessage("❌ Error changing status"); }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/users.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', user_id: userId })
      })
      const data = await response.json()
      if (data.success) {
        setUsers(users.filter(user => user.id !== userId))
        setMessage("✅ User deleted successfully")
      }
    } catch (error) { console.error(error); setMessage("❌ Error deleting user"); }
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
      // Vraćamo cijeli response objekt (uključujući challenge_id) kako bi
      // CreateChallengeForm mogao po potrebi pozvati upload privitka.
      if (data.success) { setMessage("✅ Challenge created!"); return data; }
      return Promise.reject(new Error(data.message))
    } catch (error) { setMessage("❌ Error"); return Promise.reject(error); }
  }

  const handleUpdateChallenge = async (challengeData) => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/update_challenge.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(challengeData)
      })
      const data = await response.json()
      if (data.success) { setMessage("✅ Challenge updated!"); return Promise.resolve(); }
      return Promise.reject(new Error(data.message))
    } catch (error) { setMessage("❌ Error"); return Promise.reject(error); }
  }

  const handleDeleteChallenge = async (challengeId, challengeTitle) => {
    if (!confirm(`Delete "${challengeTitle}"?`)) return
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/admin/delete_challenge.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: challengeId })
      })
      const data = await response.json()
      if (data.success) {
        setChallenges(challenges.filter(c => c.id !== challengeId))
        setMessage("✅ Challenge deleted!")
      }
    } catch (error) { setMessage("❌ Error"); }
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

  // Auto-dismiss notification poruka nakon 3 sekunde
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ====================  LOADING STATE  ====================
  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
            Verifying_Admin_Privileges...
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )

  // ====================  ERROR STATE  ====================
  if (error) return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="border-none shadow-xl max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="h-16 w-16 bg-destructive/10 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
            <p className="text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )

  // Helper za toast - boja se mijenja ovisno o tipu poruke (success/error)
  const isSuccessMsg = message.includes('✅')

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">

        {/* =====================  HERO HEADER  ===================== */}
        <div className="mb-10 border-b border-slate-200 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 mt-1 text-base md:text-lg">
                  Manage users, challenges, content and platform settings.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg self-start md:self-auto">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Live</span>
            </div>
          </div>
        </div>

        {/* =====================  TOAST PORUKE  ===================== */}
        {message && (
          <div className={`mb-6 flex items-center gap-3 p-4 rounded-xl border shadow-sm transition-all ${
            isSuccessMsg
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            {isSuccessMsg
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              : <XCircle className="h-5 w-5 shrink-0 text-rose-600" />}
            <span className="text-sm font-medium">
              {message.replace(/^[✅❌]\s*/, '')}
            </span>
          </div>
        )}

        {/* =====================  STAT KARTICE  ===================== */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            const colors = STAT_COLORS[stat.key] || STAT_COLORS.users
            return (
              <Card
                key={stat.key}
                className="border-none shadow-md bg-white overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Top accent bar - daje vizualnu kategorizaciju */}
                <div className={`h-1 ${colors.bar}`} />
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${colors.bg} ${colors.text}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* =====================  TABOVI (Pill style)  ===================== */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/30 hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* =====================  AKTIVNI TAB SADRŽAJ  ===================== */}
        {activeTab === "users" && (
          <AdminUsers
            users={users}
            onToggleAdmin={handleToggleAdmin}
            onDeleteUser={handleDeleteUser}
            onRefresh={loadUsers}
          />
        )}

        {activeTab === "challenges" && (
          <AdminChallenges
            challenges={challenges}
            categories={categories}
            onRefresh={loadChallenges}
            onDeleteChallenge={handleDeleteChallenge}
            onCreateChallenge={handleCreateChallenge}
            onUpdateChallenge={handleUpdateChallenge}
            onFileUpload={handleFileUpload}
          />
        )}

        {activeTab === "achievements" && <AdminAchievements />}
        {activeTab === "wiki" && <AdminWiki />}
        {activeTab === "content" && <AdminContent />}

      </main>
      <Footer />
    </div>
  )
}
