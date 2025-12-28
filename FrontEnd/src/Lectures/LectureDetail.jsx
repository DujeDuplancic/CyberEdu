import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Button } from "../Components/ui/button"
import { Badge } from "../Components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { 
    Play, Clock, Users, ChevronLeft, 
    Share2, Youtube, AlertCircle, ExternalLink,
    BookOpen
} from "lucide-react"

export default function LectureDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [lecture, setLecture] = useState(null)
    const [related, setRelated] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        window.scrollTo(0, 0)
        fetchLectureDetails()
    }, [id])

    const fetchLectureDetails = async () => {
        try {
            setLoading(true)
            console.log(`Fetching lecture details for ID: ${id}`)
            
            const response = await fetch(`http://localhost/CyberEdu/BackEnd/lectures/get_lecture_details.php?id=${id}`)
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Lecture details response:', data)
            
            if (data.success) {
                setLecture(data.lecture)
                setRelated(data.related || [])
            } else {
                setError(data.message || 'Failed to load lecture')
            }
        } catch (err) {
            console.error('Error fetching lecture details:', err)
            setError('Network error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (minutes) => {
        if (!minutes) return "N/A"
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const handleShare = () => {
        if (navigator.share && lecture) {
            navigator.share({
                title: lecture.title,
                text: lecture.description,
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto py-12">
                    <div className="text-center">Loading lecture...</div>
                </main>
                <Footer />
            </div>
        )
    }

    if (error || !lecture) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto py-12">
                    <div className="text-center text-red-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                        <p>{error || 'Lecture not found'}</p>
                        <Link to="/lectures">
                            <Button className="mt-4">
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back to Lectures
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto py-8">
                {/* Back button */}
                <div className="mb-6">
                    <Link to="/lectures">
                        <Button variant="ghost" size="sm">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back to Lectures
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main content - 2/3 width */}
                    <div className="lg:col-span-2">
                        {/* Video player */}
                        <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-xl">
                            <div className="aspect-video w-full">
                                {lecture.embed_url ? (
                                    <iframe
                                        src={lecture.embed_url}
                                        className="w-full h-full"
                                        title={lecture.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        frameBorder="0"
                                    ></iframe>
                                ) : lecture.video_url ? (
                                    // Fallback ako nema embed_url, koristi video_url
                                    <iframe
                                        src={`https://www.youtube.com/embed/${extractYouTubeId(lecture.video_url)}`}
                                        className="w-full h-full"
                                        title={lecture.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        frameBorder="0"
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900 to-black">
                                        <div className="text-center">
                                            <Youtube className="h-16 w-16 mx-auto text-white/50 mb-4" />
                                            <p className="text-white/70">Video not available</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lecture info */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <Badge variant="outline" className="text-sm">
                                        {lecture.category_name || 'General'}
                                    </Badge>
                                    <Badge variant="secondary" className={`text-sm ${
                                        lecture.level === 'Beginner' ? 'bg-green-500/20 text-green-500' :
                                        lecture.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                                        'bg-red-500/20 text-red-500'
                                    }`}>
                                        {lecture.level}
                                    </Badge>
                                    <Badge variant="outline" className="text-sm flex items-center gap-1">
                                        <Youtube className="h-3 w-3" />
                                        YouTube
                                    </Badge>
                                </div>
                                <h1 className="text-3xl font-bold mb-2">{lecture.title}</h1>
                                {lecture.instructor && (
                                    <p className="text-muted-foreground mb-4">
                                        Instructor: {lecture.instructor}
                                    </p>
                                )}
                            </div>

                            {/* Stats and actions */}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatDuration(lecture.duration_minutes)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {lecture.views || 0} views
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a 
                                        href={lecture.video_url || `https://www.youtube.com/watch?v=${extractYouTubeId(lecture.video_url)}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <Button variant="outline" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Open on YouTube
                                        </Button>
                                    </a>
                                    <Button variant="outline" size="icon" onClick={handleShare}>
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Description */}
                            {(lecture.description || lecture.category_name) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>About This Lecture</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {lecture.description && (
                                            <div>
                                                <p className="whitespace-pre-line text-muted-foreground">
                                                    {lecture.description}
                                                </p>
                                            </div>
                                        )}
                                        {lecture.category_name && (
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    Category: {lecture.category_name}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - 1/3 width */}
                    <div className="lg:col-span-1">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Related Lectures
                        </h3>
                        
                        {related.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                                <Youtube className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No related lectures</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {related.map((relatedLecture) => (
                                    <Link 
                                        key={relatedLecture.id} 
                                        to={`/lectures/${relatedLecture.id}`}
                                        className="block"
                                    >
                                        <Card className="hover:border-primary/50 transition-colors overflow-hidden">
                                            <div className="flex">
                                                <div className="w-1/3">
                                                    <div className="aspect-square bg-black">
                                                        {relatedLecture.thumbnail_url ? (
                                                            <img 
                                                                src={relatedLecture.thumbnail_url}
                                                                alt={relatedLecture.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-800 to-black">
                                                                <Play className="h-4 w-4 text-white/50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-2/3 p-3">
                                                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                                        {relatedLecture.title}
                                                    </h4>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>{formatDuration(relatedLecture.duration_minutes)}</span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {relatedLecture.level}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* YouTube info card */}
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Youtube className="h-5 w-5 text-red-500" />
                                    YouTube Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    This lecture is hosted on YouTube. You can watch it here or open it on YouTube for comments and likes.
                                </p>
                                <div className="text-sm">
                                    <p className="text-muted-foreground mb-1">Video URL:</p>
                                    <a 
                                        href={lecture.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline break-all text-xs"
                                    >
                                        {lecture.video_url || 'Not available'}
                                    </a>
                                </div>
                                {lecture.created_at && (
                                    <div className="text-sm">
                                        <p className="text-muted-foreground">Added:</p>
                                        <p>{new Date(lecture.created_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

// Helper funkcija za ekstrakciju YouTube ID-a
function extractYouTubeId(url) {
    if (!url) return null
    
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