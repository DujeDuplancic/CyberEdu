import { useState } from "react"
import { Button } from "../../Components/ui/button"
import { Input } from "../../Components/ui/input"

export default function CreateChallengeForm({ categories, onSubmit, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: categories[0]?.id || "",
    difficulty: "Easy",
    points: 100,
    flag: ""
  })
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setMessage("")

    try {
      await onSubmit(formData)
      setMessage("✅ Challenge created successfully!")
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create New Challenge</h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>

          {message && (
            <div className={`p-3 rounded-md mb-4 ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border border-border rounded-md"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md"
                  required
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full p-2 border border-border rounded-md"
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Points</label>
                <Input
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Flag</label>
                <Input
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleChange}
                  placeholder="CTF{...}"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="flex-1">
                {creating ? "Creating..." : "Create Challenge"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}