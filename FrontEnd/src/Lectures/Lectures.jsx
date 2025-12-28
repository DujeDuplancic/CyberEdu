import { useEffect, useState } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { Play, Clock, Users, AlertCircle, Youtube } from "lucide-react"
import { lectureService } from "./lectureService"
import { Link } from "react-router-dom"

export default function LecturesPage() {
    const [lectures, setLectures] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        window.scrollTo(0, 0)
        fetchLectures()
    }, [])

    const fetchLectures = async () => {
        try {
            setLoading(true)
            const response = await lectureService.getAllLectures()
            if (response.success) {
                setLectures(response.lectures || [])
            } else {
                setError(response.message || 'Failed to load lectures')
            }
        } catch (err) {
            setError('Network error. Please try again.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getLevelColor = (level) => {
        switch (level) {
            case "Beginner":
                return "bg-green-500/10 text-green-500 border-green-500/20"
            case "Intermediate":
                return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
            case "Advanced":
                return "bg-red-500/10 text-red-500 border-red-500/20"
            default:
                return "bg-muted text-muted-foreground"
        }
    }

    const formatDuration = (minutes) => {
        if (!minutes) return "N/A"
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto py-12">
                    <div className="text-center">Loading lectures...</div>
                </main>
                <Footer />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto py-12">
                    <div className="text-center text-red-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                        <p>{error}</p>
                        <Button onClick={fetchLectures} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Video Lectures</h1>
                    <p className="text-lg text-muted-foreground">
                        Learn cybersecurity through curated YouTube tutorials from experts.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                            All videos are hosted on YouTube
                        </span>
                    </div>
                </div>

                {lectures.length === 0 ? (
                    <div className="text-center py-12">
                        <Youtube className="h-16 w-16 mx-auto text-red-500 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No lectures available yet</h3>
                        <p className="text-muted-foreground">Check back soon for new content.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {lectures.map((lecture) => (
                            <Card key={lecture.id} className="group hover:border-primary/50 transition-all overflow-hidden h-full flex flex-col">
                                <div className="relative aspect-video overflow-hidden bg-black">
                                    {lecture.thumbnail_url ? (
                                        <img 
                                            src={lecture.thumbnail_url} 
                                            alt={lecture.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900 to-black">
                                            <Youtube className="h-16 w-16 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link to={`/lectures/${lecture.id}`}>
                                            <Button size="lg" className="rounded-full h-16 w-16 p-0 bg-red-600 hover:bg-red-700">
                                                <Play className="h-6 w-6 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                    <Badge className={`absolute top-3 right-3 ${getLevelColor(lecture.level)}`} variant="outline">
                                        {lecture.level}
                                    </Badge>
                                </div>
                                <CardHeader className="flex-grow">
                                    <CardTitle className="line-clamp-2">{lecture.title}</CardTitle>
                                    <CardDescription>
                                        {lecture.category_name || 'General'}
                                        {lecture.instructor && ` • ${lecture.instructor}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {formatDuration(lecture.duration_minutes)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {lecture.views || 0} views
                                            </span>
                                        </div>
<Link to={`/lectures/${lecture.id}`} className="block">
    <Button className="w-full bg-red-600 hover:bg-red-700">
        <Play className="h-4 w-4 mr-2" />
        Watch Lecture
    </Button>
</Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}