import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../Components/ui/card"
import { Button } from "../../Components/ui/button"
import { X, Trophy } from "lucide-react"

export default function EditAchievementForm({ achievement, categories, onSubmit, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: achievement.name || '',
    description: achievement.description || '',
    icon_url: achievement.icon_url || '',
    points_reward: achievement.points_reward || 50,
    criteria_type: achievement.criteria_type || 'solves_count',
    criteria_value: achievement.criteria_value || 1,
    category_id: achievement.category_id || '',
    is_hidden: achievement.is_hidden || false
  })
  const [loading, setLoading] = useState(false)

  const criteriaTypes = [
    { value: 'solves_count', label: 'Solves Count' },
    { value: 'points_total', label: 'Points Total' },
    { value: 'category_master', label: 'Category Master' },
    { value: 'streak', label: 'Streak' }
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const success = await onSubmit(formData)
    setLoading(false)
    
    if (success) {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <CardTitle>Edit Achievement</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Edit achievement details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Achievement Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded-md min-h-[80px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Icon URL</label>
              <input
                type="text"
                name="icon_url"
                value={formData.icon_url}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                placeholder="e.g., /achievements/first-blood.png"
              />
            </div>

            {/* Criteria Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Criteria Type *</label>
                <select
                  name="criteria_type"
                  value={formData.criteria_type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {criteriaTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Criteria Value *</label>
                <input
                  type="number"
                  name="criteria_value"
                  value={formData.criteria_value}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category (Optional)</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Global (No specific category)</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Points Reward *</label>
                <input
                  type="number"
                  name="points_reward"
                  value={formData.points_reward}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Hidden Status */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_hidden"
                name="is_hidden"
                checked={formData.is_hidden}
                onChange={handleChange}
                className="h-4 w-4"
              />
              <label htmlFor="is_hidden" className="text-sm font-medium">
                Hidden Achievement
              </label>
              <span className="text-xs text-muted-foreground">
                (Hidden achievements are not shown until unlocked)
              </span>
            </div>

            {/* Statistics (Read-only) */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Unlocked by:</span>
                  <span className="font-medium ml-2">{achievement.unlocked || 0} users</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium ml-2">
                    {new Date(achievement.unlocked_at || achievement.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}