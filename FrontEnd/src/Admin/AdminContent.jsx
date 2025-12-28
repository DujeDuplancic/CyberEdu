import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../Components/ui/table"
import { 
    Plus, Youtube, Video, X, Loader2, AlertCircle, CheckCircle, 
    Clock, User, Trash2, Edit, Eye, RefreshCw, Save, ExternalLink
} from "lucide-react"
import { Input } from "../Components/ui/input"
import { Textarea } from "../Components/ui/textarea"
import { Label } from "../Components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select"
import { Badge } from "../Components/ui/badge"

export default function AdminContent() {
    const [lectures, setLectures] = useState([])
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([])
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    
    // State za modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingLecture, setEditingLecture] = useState(null)
    
    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        instructor: '',
        duration_minutes: '',
        level: 'Beginner',
        video_url: '',
        thumbnail_url: ''
    })
    
    // Preview state
    const [videoPreview, setVideoPreview] = useState(null)
    const [isValidUrl, setIsValidUrl] = useState(false)
    
    useEffect(() => {
        fetchCategories()
        fetchLectures()
    }, [])
    
    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost/CyberEdu/BackEnd/challenges/get_categories.php')
            const data = await response.json()
            if (data.success) {
                setCategories(data.categories || [])
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }
    
    const fetchLectures = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost/CyberEdu/BackEnd/lectures/get_lectures.php')
            const data = await response.json()
            if (data.success) {
                setLectures(data.lectures || [])
            }
        } catch (error) {
            console.error('Error fetching lectures:', error)
            setError('Failed to load lectures')
        } finally {
            setLoading(false)
        }
    }
    
    const handleYouTubeUrlChange = (url) => {
        const updatedFormData = {
            ...formData,
            video_url: url
        }
        setFormData(updatedFormData)
        
        // Validacija YouTube URL-a
        const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
        const isValid = youtubeRegex.test(url)
        setIsValidUrl(isValid)
        
        // Automatski generiraj thumbnail ako je validan URL
        if (isValid) {
            const videoId = extractYouTubeVideoId(url)
            if (videoId) {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                const finalFormData = {
                    ...updatedFormData,
                    thumbnail_url: thumbnailUrl
                }
                setFormData(finalFormData)
                setVideoPreview(thumbnailUrl)
            }
        } else {
            setVideoPreview(null)
        }
    }
    
    const extractYouTubeVideoId = (url) => {
        const patterns = [
            /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
            /youtu\.be\/([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
        ]
        
        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match && match[1]) {
                return match[1]
            }
        }
        
        return null
    }
    
    const handleCreateClick = () => {
        setEditingLecture(null)
        setFormData({
            title: '',
            description: '',
            category_id: '',
            instructor: '',
            duration_minutes: '',
            level: 'Beginner',
            video_url: '',
            thumbnail_url: ''
        })
        setVideoPreview(null)
        setIsValidUrl(false)
        setError("")
        setSuccess("")
        setIsModalOpen(true)
    }
    
    const handleEditClick = (lecture) => {
        setEditingLecture(lecture)
        setFormData({
            title: lecture.title || '',
            description: lecture.description || '',
            category_id: lecture.category_id || '',
            instructor: lecture.instructor || '',
            duration_minutes: lecture.duration_minutes || '',
            level: lecture.level || 'Beginner',
            video_url: lecture.video_url || '',
            thumbnail_url: lecture.thumbnail_url || ''
        })
        
        // Set preview if there's a thumbnail
        if (lecture.thumbnail_url) {
            setVideoPreview(lecture.thumbnail_url)
        }
        
        // Validate URL
        if (lecture.video_url) {
            const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
            setIsValidUrl(youtubeRegex.test(lecture.video_url))
        }
        
        setError("")
        setSuccess("")
        setIsModalOpen(true)
    }
    
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        
        // Validacija
        if (!formData.title.trim()) {
            setError('Please enter a title')
            return
        }
        
        if (!formData.video_url || !isValidUrl) {
            setError('Please enter a valid YouTube URL')
            return
        }
        
        setLoading(true)
        
        try {
            // Dohvati user iz localStorage
            const userData = localStorage.getItem('user')
            let userId = 1 // default admin ID
            
            if (userData) {
                try {
                    const user = JSON.parse(userData)
                    userId = user.id || 1
                } catch (e) {
                    console.error('Error parsing user data:', e)
                }
            }
            
            console.log('📤 Sending lecture data:', formData)
            
            const url = editingLecture 
                ? `http://localhost/CyberEdu/BackEnd/admin/update_lecture.php?id=${editingLecture.id}`
                : 'http://localhost/CyberEdu/BackEnd/admin/create_lecture.php'
            
            const payload = editingLecture 
                ? formData
                : { ...formData, user_id: userId }
            
            // Pošalji podatke backendu
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            
            console.log('📥 Response status:', response.status)
            const responseText = await response.text()
            console.log('📥 Raw response:', responseText)
            
            let data;
            try {
                data = JSON.parse(responseText)
                console.log('📥 Parsed data:', data)
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError)
                setError('Invalid server response')
                return
            }
            
            if (data.success) {
                setSuccess(editingLecture ? '✅ Lecture updated successfully!' : '✅ Lecture created successfully!')
                setIsModalOpen(false)
                fetchLectures() // Refresh listu
                
                // Reset form after successful submission
                setTimeout(() => {
                    setFormData({
                        title: '',
                        description: '',
                        category_id: '',
                        instructor: '',
                        duration_minutes: '',
                        level: 'Beginner',
                        video_url: '',
                        thumbnail_url: ''
                    })
                    setVideoPreview(null)
                    setIsValidUrl(false)
                }, 1000)
                
            } else {
                setError(`❌ ${data.message || 'Failed to save lecture'}`)
            }
        } catch (err) {
            console.error('❌ Submission error:', err)
            setError('❌ Failed to submit. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    
    const handleDeleteLecture = async (lectureId, lectureTitle) => {
        if (!confirm(`Are you sure you want to delete lecture "${lectureTitle}"?`)) {
            return
        }
        
        try {
            const response = await fetch(`http://localhost/CyberEdu/BackEnd/admin/delete_lecture.php?id=${lectureId}`, {
                method: 'GET'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setSuccess('✅ Lecture deleted successfully!')
                fetchLectures() // Refresh listu
            } else {
                setError(`❌ ${data.message || 'Failed to delete lecture'}`)
            }
        } catch (err) {
            console.error('Delete error:', err)
            setError('❌ Failed to delete lecture')
        }
    }
    
    const formatDuration = (minutes) => {
        if (!minutes) return "N/A"
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }
    
    const getLevelColor = (level) => {
        switch (level) {
            case "Beginner":
                return "bg-green-100 text-green-800"
            case "Intermediate":
                return "bg-yellow-100 text-yellow-800"
            case "Advanced":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }
    
    const getLevelBadge = (level) => {
        switch (level) {
            case "Beginner":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{level}</Badge>
            case "Intermediate":
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{level}</Badge>
            case "Advanced":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{level}</Badge>
            default:
                return <Badge>{level}</Badge>
        }
    }
    
    return (
        <div className="space-y-6">
            {/* Header with buttons */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Video Lectures Management</h2>
                    <p className="text-muted-foreground">Manage YouTube video lectures and educational content</p>
                </div>
                
                <div className="flex gap-2">
                    <Button 
                        onClick={fetchLectures} 
                        variant="outline"
                        disabled={loading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    
                    <Button 
                        onClick={handleCreateClick}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Lecture
                    </Button>
                </div>
            </div>
            
            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}
            
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>{success}</span>
                </div>
            )}
            
            {/* Modal za Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <Youtube className="h-5 w-5 text-red-500" />
                                    {editingLecture ? 'Edit Lecture' : 'Create New Lecture'}
                                </h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* YouTube URL */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="video_url" className="flex items-center gap-2">
                                            YouTube Video URL *
                                        </Label>
                                        <Input
                                            id="video_url"
                                            name="video_url"
                                            value={formData.video_url}
                                            onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="font-mono"
                                            required
                                        />
                                        {formData.video_url && (
                                            <div className="flex items-center gap-2 text-sm">
                                                {isValidUrl ? (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span className="text-green-600">Valid YouTube URL</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                        <span className="text-red-600">Invalid YouTube URL</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Preview */}
                                    {videoPreview && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="aspect-video bg-black">
                                                <img
                                                    src={videoPreview}
                                                    alt="YouTube thumbnail preview"
                                                    className="w-full h-full object-cover opacity-90"
                                                />
                                            </div>
                                            <div className="p-3 bg-muted text-sm">
                                                <p className="font-medium">YouTube Preview</p>
                                                <p className="text-muted-foreground text-xs">
                                                    {formData.thumbnail_url && formData.thumbnail_url.includes('youtube.com') 
                                                        ? 'Auto-generated from YouTube' 
                                                        : 'Custom thumbnail'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Lecture Details */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Lecture Title *</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Introduction to Cybersecurity"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Brief description of what this lecture covers..."
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category_id">Category</Label>
                                            <select
                                                id="category_id"
                                                name="category_id"
                                                value={formData.category_id}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="">Select category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="instructor">Instructor Name</Label>
                                            <Input
                                                id="instructor"
                                                name="instructor"
                                                value={formData.instructor}
                                                onChange={handleInputChange}
                                                placeholder="Video creator or instructor name"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                                            <Input
                                                id="duration_minutes"
                                                name="duration_minutes"
                                                type="number"
                                                min="1"
                                                value={formData.duration_minutes}
                                                onChange={handleInputChange}
                                                placeholder="45"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="level">Difficulty Level</Label>
                                            <select
                                                id="level"
                                                name="level"
                                                value={formData.level}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            >
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {/* Custom Thumbnail */}
                                    <div className="space-y-2">
                                        <Label htmlFor="thumbnail_url">Custom Thumbnail URL (optional)</Label>
                                        <Input
                                            id="thumbnail_url"
                                            name="thumbnail_url"
                                            value={formData.thumbnail_url}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/thumbnail.jpg"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave empty to use YouTube auto-generated thumbnail
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Help Text */}
                                <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
                                    <p className="font-medium">Supported YouTube URL formats:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li className="font-mono text-xs">https://www.youtube.com/watch?v=VIDEO_ID</li>
                                        <li className="font-mono text-xs">https://youtu.be/VIDEO_ID</li>
                                        <li className="font-mono text-xs">https://www.youtube.com/embed/VIDEO_ID</li>
                                    </ul>
                                </div>
                                
                                {/* Form Actions */}
                                <div className="flex justify-end gap-2 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={loading}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || !isValidUrl}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {editingLecture ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {editingLecture ? 'Update Lecture' : 'Create Lecture'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Lectures Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Lectures ({lectures.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Loading lectures...</p>
                        </div>
                    ) : lectures.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Lectures Added Yet</h3>
                            <p className="text-muted-foreground mb-4">Start by adding your first YouTube video lecture</p>
                            <Button 
                                onClick={handleCreateClick}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <Youtube className="h-4 w-4 mr-2" />
                                Add First Lecture
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lectures.map((lecture) => (
                                    <TableRow key={lecture.id}>
                                        <TableCell className="font-mono">{lecture.id}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="max-w-xs truncate" title={lecture.title}>
                                                {lecture.title}
                                            </div>
                                            {lecture.description && (
                                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                    {lecture.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>{lecture.category_name || 'General'}</TableCell>
                                        <TableCell>{lecture.instructor || 'N/A'}</TableCell>
                                        <TableCell>{formatDuration(lecture.duration_minutes)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(lecture.level)}`}>
                                                {lecture.level}
                                            </span>
                                        </TableCell>
                                        <TableCell>{lecture.views || 0}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <a 
                                                        href={lecture.video_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View on YouTube"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleEditClick(lecture)}
                                                    title="Edit lecture"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
                                                    title="Delete lecture"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}