import { useState, useRef } from "react"
import { Button } from "../../Components/ui/button"
import { Input } from "../../Components/ui/input"
import { Upload, Download, X } from "lucide-react"

export default function EditChallengeForm({ challenge, categories, onSubmit, onClose, onSuccess, onFileUpload }) {
  const [formData, setFormData] = useState({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    category_id: challenge.category_id,
    difficulty: challenge.difficulty,
    points: challenge.points,
    flag: "", // Ne prikazuj postojeći flag zbog sigurnosti
    file_url: challenge.file_url || ""
  })
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setMessage("")

    try {
      await onSubmit(formData)
      setMessage("✅ Challenge updated successfully!")
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value
    }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setMessage("")

    try {
      await onFileUpload(file, challenge.id)
      setMessage("✅ File uploaded successfully!")
      // Reload challenge data to get updated file_url
      onSuccess()
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = async () => {
    try {
      await onSubmit({
        id: challenge.id,
        file_url: null
      })
      setMessage("✅ File removed successfully!")
      onSuccess()
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }
  }

  const getFileName = (url) => {
    if (!url) return ''
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Challenge</h2>
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
                <label className="block text-sm font-medium mb-2">New Flag (optional)</label>
                <Input
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleChange}
                  placeholder="Leave empty to keep current flag"
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Challenge Files</label>
              
              {formData.file_url ? (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getFileName(formData.file_url)}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-md p-4 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload challenge files (ZIP, PDF, TXT, images, binaries)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Choose File"}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={updating} className="flex-1">
                {updating ? "Updating..." : "Update Challenge"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}