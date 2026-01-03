import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Plus, Edit, Trash2, Eye, EyeOff, Trophy, Award, Filter } from "lucide-react"
import CreateAchievementForm from "./Components/CreateAchievementForm"
import EditAchievementForm from "./Components/EditAchievementForm"
import { api } from '../lib/api'

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState(null)
  const [filter, setFilter] = useState('all') // 'all', 'visible', 'hidden'

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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading achievements...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements Management
              </CardTitle>
              <CardDescription>Create and manage platform achievements</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline">
                Refresh
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Achievement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All Achievements ({achievements.length})
              </Button>
              <Button
                variant={filter === 'visible' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('visible')}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                Visible ({achievements.filter(a => !a.is_hidden).length})
              </Button>
              <Button
                variant={filter === 'hidden' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter('hidden')}
                className="flex items-center gap-1"
              >
                <EyeOff className="h-3 w-3" />
                Hidden ({achievements.filter(a => a.is_hidden).length})
              </Button>
            </div>
          </div>

          {/* Achievements List */}
          <div className="space-y-4">
            {getFilteredAchievements().length > 0 ? (
              getFilteredAchievements().map((achievement) => (
                <div
                  key={achievement.id}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-primary/10 rounded">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{achievement.name}</p>
                            {achievement.is_hidden ? (
                              <span className="px-2 py-1 text-xs bg-gray-500 text-white rounded-md">
                                Hidden
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-green-500 text-white rounded-md">
                                Visible
                              </span>
                            )}
                            <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md">
                              +{achievement.points_reward} pts
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {achievement.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-10 mt-2 space-y-1">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{getCriteriaTypeLabel(achievement.criteria_type)}</span>
                          
                          <span className="text-muted-foreground">Required:</span>
                          <span className="font-medium">{achievement.criteria_value}</span>
                          
                          {achievement.category_name && (
                            <>
                              <span className="text-muted-foreground">Category:</span>
                              <span className="font-medium">{achievement.category_name}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">Unlocks:</span>
                          <span className="font-medium">{achievement.unlocked || 0} users</span>
                          
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">
                            {new Date(achievement.unlocked_at || achievement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVisibility(achievement.id, achievement.is_hidden)}
                        title={achievement.is_hidden ? "Make Visible" : "Hide"}
                      >
                        {achievement.is_hidden ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingAchievement(achievement)
                          setShowEditForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAchievement(achievement.id, achievement.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No achievements found</h3>
                <p className="text-muted-foreground mb-4">
                  {filter !== 'all' 
                    ? `No ${filter} achievements found. Try changing the filter.`
                    : "Create your first achievement to get started!"}
                </p>
                {filter !== 'all' && (
                  <Button onClick={() => setFilter('all')} variant="outline" className="mr-2">
                    Show All Achievements
                  </Button>
                )}
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Achievement
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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