import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import {
    Plus, Youtube, Video, X, Loader2, AlertCircle, CheckCircle,
    Clock, Trash2, Edit, ExternalLink, RefreshCw, Save, Search,
    Layers, BookOpen, User
} from "lucide-react"
import { Input } from "../Components/ui/input"
import { Textarea } from "../Components/ui/textarea"
import { Label } from "../Components/ui/label"
import AdminPagination from "./Components/AdminPagination"

// Stranica veličina - usklađena s ostalim admin listama
const PAGE_SIZE = 8

// Mapa boja za level - soft tonovi konzistentni s ostatkom app-a
const LEVEL_COLORS = {
    Beginner:     "bg-emerald-50 text-emerald-700 border-emerald-100",
    Intermediate: "bg-amber-50 text-amber-700 border-amber-100",
    Advanced:     "bg-rose-50 text-rose-700 border-rose-100"
}

export default function AdminContent() {
    const [lectures, setLectures] = useState([])
    const [loading, setLoading] = useState(true)
    const [categories, setCategories] = useState([])
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Pretraga + paginacija
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)

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

    useEffect(() => { setCurrentPage(1) }, [search, lectures.length])

    // ===================================================================
    // FETCH funkcije - business logika je apsolutno netaknuta
    // ===================================================================
    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost/CyberEdu/BackEnd/challenges/get_categories.php')
            const data = await response.json()
            if (data.success) setCategories(data.categories || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    const fetchLectures = async () => {
        try {
            setLoading(true)
            const response = await fetch('http://localhost/CyberEdu/BackEnd/lectures/get_lectures.php')
            const data = await response.json()
            if (data.success) setLectures(data.lectures || [])
        } catch (error) {
            console.error('Error fetching lectures:', error)
            setError('Failed to load lectures')
        } finally {
            setLoading(false)
        }
    }

    // ===================================================================
    // YouTube URL handling - validacija + automatski thumbnail
    // ===================================================================
    const handleYouTubeUrlChange = (url) => {
        const updatedFormData = { ...formData, video_url: url }
        setFormData(updatedFormData)

        const youtubeRegex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
        const isValid = youtubeRegex.test(url)
        setIsValidUrl(isValid)

        if (isValid) {
            const videoId = extractYouTubeVideoId(url)
            if (videoId) {
                const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                setFormData({ ...updatedFormData, thumbnail_url: thumbnailUrl })
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
            if (match && match[1]) return match[1]
        }
        return null
    }

    // ===================================================================
    // Modal akcije - create/edit/delete
    // ===================================================================
    const handleCreateClick = () => {
        setEditingLecture(null)
        setFormData({
            title: '', description: '', category_id: '', instructor: '',
            duration_minutes: '', level: 'Beginner', video_url: '', thumbnail_url: ''
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

        if (lecture.thumbnail_url) setVideoPreview(lecture.thumbnail_url)
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
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (!formData.title.trim()) { setError('Please enter a title'); return }
        if (!formData.video_url || !isValidUrl) {
            setError('Please enter a valid YouTube URL')
            return
        }

        setLoading(true)
        try {
            const userData = localStorage.getItem('user')
            let userId = 1
            if (userData) {
                try {
                    const user = JSON.parse(userData)
                    userId = user.id || 1
                } catch (e) { console.error('Error parsing user data:', e) }
            }

            const url = editingLecture
                ? `http://localhost/CyberEdu/BackEnd/admin/update_lecture.php?id=${editingLecture.id}`
                : 'http://localhost/CyberEdu/BackEnd/admin/create_lecture.php'

            const payload = editingLecture
                ? formData
                : { ...formData, user_id: userId }

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const responseText = await response.text()
            let data
            try {
                data = JSON.parse(responseText)
            } catch (parseError) {
                console.error('JSON parse error:', parseError)
                setError('Invalid server response')
                return
            }

            if (data.success) {
                setSuccess(editingLecture ? 'Lecture updated successfully' : 'Lecture created successfully')
                setIsModalOpen(false)
                fetchLectures()
            } else {
                setError(data.message || 'Failed to save lecture')
            }
        } catch (err) {
            console.error('Submission error:', err)
            setError('Failed to submit. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteLecture = async (lectureId, lectureTitle) => {
        if (!confirm(`Are you sure you want to delete lecture "${lectureTitle}"?`)) return

        try {
            const response = await fetch(`http://localhost/CyberEdu/BackEnd/admin/delete_lecture.php?id=${lectureId}`, {
                method: 'GET'
            })
            const data = await response.json()

            if (data.success) {
                setSuccess('Lecture deleted successfully')
                fetchLectures()
            } else {
                setError(data.message || 'Failed to delete lecture')
            }
        } catch (err) {
            console.error('Delete error:', err)
            setError('Failed to delete lecture')
        }
    }

    // ===================================================================
    // Helperi za prikaz
    // ===================================================================
    const formatDuration = (minutes) => {
        if (!minutes) return "N/A"
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    // ===================================================================
    // Klijentsko filtriranje + paginacija
    // ===================================================================
    const filteredLectures = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return lectures
        return lectures.filter((l) =>
            (l.title || "").toLowerCase().includes(q) ||
            (l.instructor || "").toLowerCase().includes(q) ||
            (l.category_name || "").toLowerCase().includes(q) ||
            (l.level || "").toLowerCase().includes(q)
        )
    }, [lectures, search])

    const totalPages = Math.max(1, Math.ceil(filteredLectures.length / PAGE_SIZE))
    const visibleLectures = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filteredLectures.slice(start, start + PAGE_SIZE)
    }, [filteredLectures, currentPage])

    return (
        <div className="space-y-6">

            {/* Header sekcije */}
            <Card className="border-none shadow-md bg-white">
                <CardContent className="pt-5 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Video className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Video Lectures Management</h2>
                            <p className="text-sm text-slate-500">
                                Manage YouTube video lectures and educational content.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
                            {lectures.length} total
                        </span>
                        <Button onClick={fetchLectures} variant="outline" disabled={loading} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                        <Button onClick={handleCreateClick} className="gap-2 shadow-md shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            New lecture
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Toast poruke */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span className="text-sm font-medium">{success}</span>
                </div>
            )}

            {/* Pretraga */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search by title, instructor, category or level..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white border-slate-200 h-11"
                />
            </div>

            {/* Lista lectura - kao grid kartice s thumbnail-om */}
            <Card className="border-none shadow-md bg-white">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-16 text-center">
                            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                                Loading_Lectures...
                            </p>
                        </div>
                    ) : filteredLectures.length === 0 ? (
                        <div className="py-16 text-center px-6">
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                <Video className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {search ? "No lectures match your search" : "No lectures yet"}
                            </h3>
                            <p className="text-slate-500 mt-1 mb-6">
                                {search
                                    ? "Try a different search term."
                                    : "Start by adding your first YouTube video lecture."}
                            </p>
                            {!search && (
                                <Button onClick={handleCreateClick} className="gap-2 shadow-md shadow-primary/20">
                                    <Youtube className="h-4 w-4" />
                                    Add first lecture
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {visibleLectures.map((lecture) => {
                                const levelClass =
                                    LEVEL_COLORS[lecture.level] ||
                                    "bg-slate-50 text-slate-700 border-slate-200"

                                return (
                                    <li
                                        key={lecture.id}
                                        className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-slate-50/60 transition-colors"
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-32 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100 relative">
                                            {lecture.thumbnail_url ? (
                                                <>
                                                    <img
                                                        src={lecture.thumbnail_url}
                                                        alt={lecture.title}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                                                    />
                                                    {/* Mali Youtube indikator preko thumbnaila */}
                                                    <div className="absolute bottom-1 right-1 bg-black/70 rounded p-1">
                                                        <Youtube className="h-3 w-3 text-red-500" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Video className="h-6 w-6 text-slate-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Glavni info blok */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <p className="font-bold text-slate-900 truncate">{lecture.title}</p>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${levelClass}`}>
                                                    {lecture.level}
                                                </span>
                                            </div>

                                            {lecture.description && (
                                                <p className="text-sm text-slate-500 line-clamp-1 mb-1">
                                                    {lecture.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                                {lecture.category_name && (
                                                    <span className="flex items-center gap-1">
                                                        <Layers className="h-3 w-3" />
                                                        {lecture.category_name}
                                                    </span>
                                                )}
                                                {lecture.instructor && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {lecture.instructor}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDuration(lecture.duration_minutes)}
                                                </span>
                                                <span className="font-mono">{lecture.views || 0} views</span>
                                            </div>
                                        </div>

                                        {/* Akcije */}
                                        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="gap-1.5"
                                            >
                                                <a href={lecture.video_url} target="_blank" rel="noopener noreferrer" title="View on YouTube">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    View
                                                </a>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditClick(lecture)}
                                                className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                            >
                                                <Edit className="h-3.5 w-3.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteLecture(lecture.id, lecture.title)}
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

            {/* Paginacija */}
            <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredLectures.length}
                pageSize={PAGE_SIZE}
            />

            {/* ============================================================ */}
            {/* MODAL ZA CREATE / EDIT                                       */}
            {/* ============================================================ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden border border-slate-200 flex flex-col">

                        {/* Modal header - YouTube gradient */}
                        <div className="bg-gradient-to-br from-red-600 to-rose-700 p-6 text-white relative">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <Youtube className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold tracking-tight">
                                        {editingLecture ? 'Edit Lecture' : 'Create New Lecture'}
                                    </h3>
                                    <p className="text-red-100 text-xs font-bold uppercase tracking-widest mt-0.5">
                                        {editingLecture ? `Editing ID #${editingLecture.id}` : 'YouTube-powered content'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfe]">
                            <form onSubmit={handleSubmit} className="space-y-5">

                                {/* YouTube URL */}
                                <div className="space-y-2">
                                    <Label htmlFor="video_url" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                        <Youtube className="h-3.5 w-3.5 text-red-500" />
                                        YouTube URL *
                                    </Label>
                                    <Input
                                        id="video_url"
                                        name="video_url"
                                        value={formData.video_url}
                                        onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="h-11 font-mono"
                                        required
                                    />
                                    {formData.video_url && (
                                        <div className="flex items-center gap-1.5 text-xs">
                                            {isValidUrl ? (
                                                <>
                                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span className="text-emerald-700 font-medium">Valid YouTube URL</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                                                    <span className="text-rose-700 font-medium">Invalid YouTube URL</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail preview */}
                                {videoPreview && (
                                    <div className="rounded-xl overflow-hidden border border-slate-200">
                                        <div className="aspect-video bg-black">
                                            <img
                                                src={videoPreview}
                                                alt="YouTube thumbnail preview"
                                                className="w-full h-full object-cover opacity-95"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
                                            <Youtube className="h-3.5 w-3.5 text-red-500" />
                                            {formData.thumbnail_url && formData.thumbnail_url.includes('youtube.com')
                                                ? 'Auto-generated YouTube thumbnail'
                                                : 'Custom thumbnail'}
                                        </div>
                                    </div>
                                )}

                                {/* Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Title *
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="Introduction to Cybersecurity"
                                        className="h-11"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description of what this lecture covers..."
                                        rows={3}
                                    />
                                </div>

                                {/* Grid: Category + Instructor */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category_id" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                            Category
                                        </Label>
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>{category.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="instructor" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                            Instructor
                                        </Label>
                                        <Input
                                            id="instructor"
                                            name="instructor"
                                            value={formData.instructor}
                                            onChange={handleInputChange}
                                            placeholder="Video creator or instructor name"
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                {/* Grid: Duration + Level */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration_minutes" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                            Duration (minutes)
                                        </Label>
                                        <Input
                                            id="duration_minutes"
                                            name="duration_minutes"
                                            type="number"
                                            min="1"
                                            value={formData.duration_minutes}
                                            onChange={handleInputChange}
                                            placeholder="45"
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="level" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                            Difficulty level
                                        </Label>
                                        <select
                                            id="level"
                                            name="level"
                                            value={formData.level}
                                            onChange={handleInputChange}
                                            className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Custom thumbnail */}
                                <div className="space-y-2">
                                    <Label htmlFor="thumbnail_url" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                        Custom thumbnail URL <span className="text-slate-400 lowercase tracking-normal">(optional)</span>
                                    </Label>
                                    <Input
                                        id="thumbnail_url"
                                        name="thumbnail_url"
                                        value={formData.thumbnail_url}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/thumbnail.jpg"
                                        className="h-11"
                                    />
                                    <p className="text-xs text-slate-400">
                                        Leave empty to use the auto-generated YouTube thumbnail.
                                    </p>
                                </div>

                                {/* Akcije */}
                                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={loading}
                                        className="gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || !isValidUrl}
                                        className="gap-2 shadow-md shadow-primary/20"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {editingLecture ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                {editingLecture ? 'Update lecture' : 'Create lecture'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
