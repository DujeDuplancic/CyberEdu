"use client"

import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Button } from "../Components/ui/button"
import { Badge } from "../Components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/ui/card"
import { 
    Play, Clock, Users, ChevronLeft, 
    Share2, Youtube, AlertCircle, ExternalLink,
    BookOpen, Calendar, Info
} from "lucide-react"

export default function LectureDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [lecture, setLecture] = useState(null)
    const [related, setRelated] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const API_BASE = 'http://localhost/CyberEdu/BackEnd/'

    useEffect(() => {
        window.scrollTo(0, 0)
        fetchLectureDetails()
    }, [id])

    const fetchLectureDetails = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE}lectures/get_lecture_details.php?id=${id}`)
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            
            const data = await response.json()
            if (data.success) {
                setLecture(data.lecture)
                setRelated(data.related || [])
            } else {
                setError(data.message || 'Failed to load lecture')
            }
        } catch (err) {
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
            <div className="min-h-screen flex flex-col bg-[#f8fafc]">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-mono text-slate-500 animate-pulse">DECRYPTING_LECTURE_DATA...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    if (error || !lecture) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f8fafc]">
                <Header />
                <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-24">
                    <div className="max-w-md mx-auto text-center space-y-6 bg-white p-12 rounded-2xl shadow-xl">
                        <AlertCircle className="h-20 w-20 mx-auto text-red-500/20" />
                        <h2 className="text-2xl font-bold text-slate-800">{error || 'Lecture not found'}</h2>
                        <Button onClick={() => navigate('/lectures')} className="w-full">
                            <ChevronLeft className="h-4 w-4 mr-2" /> Back to Library
                        </Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-12 py-10">
                {/* Navigation & Breadcrumb */}
                <div className="mb-8 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/lectures')}
                        className="hover:bg-white shadow-sm border border-transparent hover:border-slate-200 transition-all"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Lectures
                    </Button>
                    
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={handleShare} className="bg-white">
                            <Share2 className="h-4 w-4 mr-2" /> Share
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* LEFT COLUMN: Player & Details (8 Units) */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Cinema-Style Video Player */}
                        <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                            <div className="aspect-video w-full bg-black relative">
                                {lecture.embed_url || lecture.video_url ? (
                                    <iframe
                                        src={lecture.embed_url || `https://www.youtube.com/embed/${extractYouTubeId(lecture.video_url)}`}
                                        className="w-full h-full"
                                        title={lecture.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                        <Youtube className="h-16 w-16 mb-4 opacity-20" />
                                        <p>Source link broken or unavailable</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Metadata Area */}
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="space-y-3 max-w-3xl">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none px-3">
                                            {lecture.category_name || 'Cybersecurity'}
                                        </Badge>
                                        <Badge variant="outline" className={`
                                            ${lecture.level === 'Beginner' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                                              lecture.level === 'Intermediate' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                                              'border-rose-200 text-rose-600 bg-rose-50'}
                                        `}>
                                            {lecture.level}
                                        </Badge>
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                        {lecture.title}
                                    </h1>
                                    <p className="text-lg text-slate-500 flex items-center gap-2">
                                        <span className="font-semibold text-slate-700">Instructor:</span> {lecture.instructor || 'Guest Expert'}
                                    </p>
                                </div>

                                <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="text-center px-4 border-r border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                                        <p className="text-lg font-mono font-bold text-slate-700">{formatDuration(lecture.duration_minutes)}</p>
                                    </div>
                                    <div className="text-center px-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Views</p>
                                        <p className="text-lg font-mono font-bold text-slate-700">{lecture.views || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description Card */}
                            <Card className="border-none shadow-md bg-white">
                                <CardHeader className="border-b border-slate-50">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        Lecture Abstract
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-lg">
                                        {lecture.description || "No detailed abstract provided for this briefing."}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Related & Sidebar (4 Units) */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Action Card */}
                        <Card className="bg-primary text-white border-none shadow-lg overflow-hidden relative group">
                            <Youtube className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform" />
                            <CardHeader>
                                <CardTitle className="text-white">Watch on Source</CardTitle>
                                <CardDescription className="text-white/80">Continue the discussion and engage with the community on YouTube.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    asChild
                                    className="w-full bg-white text-primary hover:bg-slate-100 font-bold h-12 shadow-xl"
                                >
                                    <a href={lecture.video_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" /> Open External Player
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Metadata Details Sidebar */}
                        <Card className="border-none shadow-md bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Info className="h-5 w-5 text-slate-400" />
                                    Intel Briefing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                    <span className="text-slate-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Released</span>
                                    <span className="font-bold text-slate-700">
                                        {lecture.created_at ? new Date(lecture.created_at).toLocaleDateString('en-GB') : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-slate-500 flex items-center gap-2"><Users className="h-4 w-4" /> Platform</span>
                                    <Badge variant="secondary" className="bg-red-50 text-red-600 border-none">YouTube</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Related Lectures List */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Play className="h-5 w-5 text-primary" /> Related Ops
                            </h3>
                            <div className="space-y-3">
                                {related.length > 0 ? related.map((item) => (
                                    <Link key={item.id} to={`/lectures/${item.id}`} className="block group">
                                        <Card className="border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden flex items-center h-28 group-hover:translate-x-1 transition-transform">
                                            <div className="w-32 h-full relative flex-shrink-0 bg-slate-900">
                                                {item.thumbnail_url ? (
                                                    <img src={item.thumbnail_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Youtube className="h-6 w-6 text-slate-700" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                                                    <span className="text-[10px] font-mono text-white font-bold">{formatDuration(item.duration_minutes)}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                                                    {item.title}
                                                </h4>
                                                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                                                    {item.level}
                                                </Badge>
                                            </div>
                                        </Card>
                                    </Link>
                                )) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 text-sm font-mono tracking-tighter">NO_SIMILAR_DATA_FOUND</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}

function extractYouTubeId(url) {
    if (!url) return null
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