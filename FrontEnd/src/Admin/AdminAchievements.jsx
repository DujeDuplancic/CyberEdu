import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Plus, Edit, Trash2, Eye, EyeOff, Trophy, Award, Filter, RefreshCw } from "lucide-react"
import CreateAchievementForm from "./Components/CreateAchievementForm"
import EditAchievementForm from "./Components/EditAchievementForm"
import AdminPagination from "./Components/AdminPagination"
import { api } from '../lib/api'

// Broj postignuća po stranici
const PAGE_SIZE = 8

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'visible', 'hidden'
  const [currentPage, setCurrentPage] = useState(1)

  // Reset stranice pri promjeni filtera ili dolasku novih podataka
  useEffect(() => { setCurrentPage(1) }, [filter, achievements.length])

  // Fetch achievements and categories
const fetchData = async () => {
  try {
    setLoading(true)
    
    // Fetch achievements - DODAJ user_id parametar
    const userData = localStorage.getItem('user');
    const user = JSON.parse(userData);
    
    console.log("🔄 Fetching achievements for user ID:", user.id);
    
    // Prvo pokušaj sa user_id
    const achievementsRes = await api.get(`/achievements/get_achievements.php?user_id=${user.id}`);
    console.log("📊 Achievements API response:", achievementsRes);
    
    if (achievementsRes.success) {
      console.log(`✅ Loaded ${achievementsRes.achievements?.length || 0} achievements`);
      setAchievements(achievementsRes.achievements || []);
    } else {
      console.error("❌ Failed to load achievements:", achievementsRes.message);
      // Pokušaj bez user_id kao fallback
      const achievementsRes2 = await api.get('/achievements/get_achievements.php');
      if (achievementsRes2.success) {
        setAchievements(achievementsRes2.achievements || []);
      }
    }
    
    // Fetch categories
    const categoriesRes = await api.get('/challenges/get_categories.php')
    console.log("📊 Categories API response:", categoriesRes);
    
    if (categoriesRes.success) {
      setCategories(categoriesRes.categories || [])
    }
    
  } catch (error) {
    console.error('❌ Error fetching data:', error)
    // Dodaj fallback mock data za testiranje
    setAchievements([
      {
        id: 1,
        name: "Test Achievement",
        description: "This is a test achievement",
        points_reward: 50,
        criteria_type: "solves_count",
        criteria_value: 1,
        category_name: null,
        unlocked: false,
        is_hidden: false
      }
    ]);
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateAchievement = async (achievementData) => {
    try {
      const response = await api.post('/admin/create_achievement.php', achievementData)
      if (response.success) {
        alert('Achievement created successfully!')
        fetchData()
        return true
      } else {
        alert('Error creating achievement: ' + response.message)
        return false
      }
    } catch (error) {
      console.error('Error creating achievement:', error)
      alert('Error creating achievement')
      return false
    }
  }

  const handleUpdateAchievement = async (id, achievementData) => {
    try {
      const response = await api.put(`/admin/update_achievement.php?id=${id}`, achievementData)
      if (response.success) {
        alert('Achievement updated successfully!')
        fetchData()
        return true
      } else {
        alert('Error updating achievement: ' + response.message)
        return false
      }
    } catch (error) {
      console.error('Error updating achievement:', error)
      alert('Error updating achievement')
      return false
    }
  }

  const handleDeleteAchievement = async (id, name) => {
    if (!confirm(`Are you sure you want to delete achievement: "${name}"?`)) {
      return
    }

    try {
      const response = await api.delete(`/admin/delete_achievement.php?id=${id}`)
      if (response.success) {
        alert('Achievement deleted successfully!')
        fetchData()
      } else {
        alert('Error deleting achievement: ' + response.message)
      }
    } catch (error) {
      console.error('Error deleting achievement:', error)
      alert('Error deleting achievement')
    }
  }

  const handleToggleVisibility = async (id, currentVisibility) => {
    try {
      const response = await api.put(`/admin/toggle_achievement_visibility.php?id=${id}`, {
        is_hidden: !currentVisibility
      })
      if (response.success) {
        alert('Achievement visibility updated!')
        fetchData()
      } else {
        alert('Error updating visibility: ' + response.message)
      }
    } catch (error) {
      console.error('Error toggling visibility:', error)
      alert('Error updating visibility')
    }
  }

  const getFilteredAchievements = () => {
    switch (filter) {
      case 'visible':
        return achievements.filter(a => !a.is_hidden)
      case 'hidden':
        return achievements.filter(a => a.is_hidden)
      default:
        return achievements
    }
  }

  const getCriteriaTypeLabel = (type) => {
    const labels = {
      'solves_count': 'Solves Count',
      'points_total': 'Points Total',
      'category_master': 'Category Master',
      'streak': 'Streak'
    }
    return labels[type] || type
  }

  // VAŽNO: svi hookovi MORAJU biti pozvani prije bilo kakvog early return-a.
  // Inače React detektira različit broj hookova između render-ova i baca
  // "Rendered more hooks than during the previous render" grešku.
  const filteredList = getFilteredAchievements()
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE))
  const visibleList = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredList.slice(start, start + PAGE_SIZE)
  }, [filteredList, currentPage])

  // Tek SAD je sigurno raditi early return za loading
  if (loading) {
    return (
      <Card className="border-none shadow-md bg-white">
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              Loading_Achievements...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header sekcije */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="pt-5 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Achievements Management</h2>
              <p className="text-sm text-slate-500">
                Create and manage platform achievements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
              {achievements.length} total
            </span>
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              New achievement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter chips - dosljedan s NewsPage/Profile filter stilom */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-black uppercase tracking-widest mr-1">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </div>
        {[
          { key: 'all',     label: 'All',     count: achievements.length, icon: null },
          { key: 'visible', label: 'Visible', count: achievements.filter(a => !a.is_hidden).length, icon: Eye },
          { key: 'hidden',  label: 'Hidden',  count: achievements.filter(a => a.is_hidden).length,  icon: EyeOff }
        ].map((f) => {
          const isActive = filter === f.key
          const Icon = f.icon
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/30 hover:text-primary"
              }`}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {f.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}>
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista postignuća */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No achievements found</h3>
              <p className="text-slate-500 mb-6">
                {filter !== 'all'
                  ? `No ${filter} achievements. Try changing the filter.`
                  : "Create your first achievement to get started."}
              </p>
              <div className="flex items-center justify-center gap-2">
                {filter !== 'all' && (
                  <Button onClick={() => setFilter('all')} variant="outline">
                    Show all
                  </Button>
                )}
                <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create achievement
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleList.map((achievement) => {
                const isHidden = !!achievement.is_hidden
                return (
                  <li
                    key={achievement.id}
                    className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 p-5 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Lijevi blok: ikona + sadržaj */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isHidden ? "bg-slate-100 text-slate-400" : "bg-primary/10 text-primary"
                      }`}>
                        <Award className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Naslov + statusni chipovi */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-slate-900">{achievement.name}</p>

                          {isHidden ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <Eye className="h-3 w-3" />
                              Visible
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-black uppercase tracking-widest">
                            +{achievement.points_reward} pts
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 mb-2">
                          {achievement.description}
                        </p>

                        {/* Meta podaci - kompaktan red */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            <span className="font-medium text-slate-500">Type:</span>{' '}
                            {getCriteriaTypeLabel(achievement.criteria_type)}
                          </span>
                          <span>
                            <span className="font-medium text-slate-500">Required:</span>{' '}
                            <span className="font-mono">{achievement.criteria_value}</span>
                          </span>
                          {achievement.category_name && (
                            <span>
                              <span className="font-medium text-slate-500">Category:</span>{' '}
                              {achievement.category_name}
                            </span>
                          )}
                          <span>
                            <span className="font-medium text-slate-500">Unlocks:</span>{' '}
                            {achievement.unlocked || 0} users
                          </span>
                          <span>
                            <span className="font-medium text-slate-500">Created:</span>{' '}
                            {new Date(achievement.unlocked_at || achievement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desni blok: akcije */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVisibility(achievement.id, achievement.is_hidden)}
                        className="gap-1.5"
                        title={isHidden ? "Make visible" : "Hide"}
                      >
                        {isHidden
                          ? <><Eye className="h-3.5 w-3.5" /> Show</>
                          : <><EyeOff className="h-3.5 w-3.5" /> Hide</>}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAchievement(achievement)
                          setShowEditForm(true)
                        }}
                        className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAchievement(achievement.id, achievement.name)}
                        className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Paginacija - prikazuje se ako ima više od jedne stranice */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredList.length}
        pageSize={PAGE_SIZE}
      />

      {/* Create Achievement Modal */}
      {showCreateForm && (
        <CreateAchievementForm
          categories={categories}
          onSubmit={handleCreateAchievement}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchData()
          }}
        />
      )}

      {/* Edit Achievement Modal */}
      {showEditForm && editingAchievement && (
        <EditAchievementForm
          achievement={editingAchievement}
          categories={categories}
          onSubmit={(data) => handleUpdateAchievement(editingAchievement.id, data)}
          onClose={() => {
            setShowEditForm(false)
            setEditingAchievement(null)
          }}
          onSuccess={() => {
            setShowEditForm(false)
            setEditingAchievement(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}