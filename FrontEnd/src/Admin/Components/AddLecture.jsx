import { useState, useEffect } from "react"
import { Button } from "../../Components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../Components/ui/card"
import { Input } from "../../Components/ui/input"
import { Textarea } from "../../Components/ui/textarea"
import { Label } from "../../Components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../Components/ui/select"
import { 
    Youtube, Link, Loader2, CheckCircle, 
    AlertCircle, Clock, User, X
} from "lucide-react"

export default function AddLecture({ onCreateLecture }) {
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    
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
    
    const handleYouTubeUrlChange = (url) => {
        setFormData(prev => ({ ...prev, video_url: url }))
        
        // Validacija YouTube URL-a
        const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
        const isValid = youtubeRegex.test(url)
        setIsValidUrl(isValid)
        
        // Automatski generiraj thumbnail ako je validan URL
        if (isValid) {
            const videoId = extractYouTubeVideoId(url)
            if (videoId) {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                setFormData(prev => ({ 
                    ...prev, 
                    thumbnail_url: thumbnailUrl 
                }))
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
            // Dohvati user iz localStorage (kao u Admin.jsx)
            const userData = localStorage.getItem('user')
            if (!userData) {
                throw new Error('User not logged in')
            }
            
            const user = JSON.parse(userData)
            
            // Pošalji podatke backendu
            const response = await fetch('http://localhost/CyberEdu/BackEnd/admin/create_lecture.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                setSuccess('Lecture created successfully!')
                
                // Resetuj formu
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
                
                // Ako je propušten callback, pozovi ga
                if (onCreateLecture) {
                    onCreateLecture(data.lecture)
                }
                
            } else {
                setError(data.message || 'Failed to create lecture')
            }
        } catch (err) {
            console.error('Submission error:', err)
            setError('Failed to submit. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    
    const handleChange = (e) => {
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
    
    const clearForm = () => {
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
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Add New Lecture</h2>
                <p className="text-muted-foreground">
                    Add a YouTube video lecture by providing the video URL and details.
                </p>
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* YouTube URL */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Youtube className="h-5 w-5 text-red-500" />
                            YouTube Video
                        </CardTitle>
                        <CardDescription>
                            Enter the YouTube video URL for this lecture
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="video_url" className="flex items-center gap-2">
                                <Link className="h-4 w-4" />
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
                                        Thumbnail auto-generated from video URL
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Lecture Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lecture Details</CardTitle>
                        <CardDescription>
                            Provide information about this lecture
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Lecture Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
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
                                onChange={handleChange}
                                placeholder="Brief description of what this lecture covers..."
                                rows={3}
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(value) => handleSelectChange('category_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="instructor" className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    Instructor
                                </Label>
                                <Input
                                    id="instructor"
                                    name="instructor"
                                    value={formData.instructor}
                                    onChange={handleChange}
                                    placeholder="Video creator name"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration_minutes" className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Duration (minutes)
                                </Label>
                                <Input
                                    id="duration_minutes"
                                    name="duration_minutes"
                                    type="number"
                                    min="1"
                                    value={formData.duration_minutes}
                                    onChange={handleChange}
                                    placeholder="45"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="level">Difficulty Level</Label>
                                <Select
                                    value={formData.level}
                                    onValueChange={(value) => handleSelectChange('level', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {/* Custom Thumbnail (opcionalno) */}
                        <div className="space-y-2">
                            <Label htmlFor="thumbnail_url">Custom Thumbnail URL (optional)</Label>
                            <Input
                                id="thumbnail_url"
                                name="thumbnail_url"
                                value={formData.thumbnail_url}
                                onChange={handleChange}
                                placeholder="https://example.com/thumbnail.jpg"
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty to use YouTube auto-generated thumbnail
                            </p>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Form Actions */}
                <div className="flex justify-between pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={clearForm}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <X className="h-4 w-4" />
                        Clear Form
                    </Button>
                    
                    <div className="flex gap-3">
                        <Button
                            type="submit"
                            disabled={loading || !isValidUrl}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Youtube className="h-4 w-4 mr-2" />
                                    Add Lecture
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                
                {/* Help Text */}
                <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium">Supported YouTube URL formats:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li className="font-mono text-xs">https://www.youtube.com/watch?v=VIDEO_ID</li>
                        <li className="font-mono text-xs">https://youtu.be/VIDEO_ID</li>
                        <li className="font-mono text-xs">https://www.youtube.com/embed/VIDEO_ID</li>
                    </ul>
                </div>
            </form>
        </div>
    )
}