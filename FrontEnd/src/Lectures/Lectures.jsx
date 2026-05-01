"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { 
    Play, Clock, Users, AlertCircle, 
    Youtube, Search, ChevronLeft, 
    ChevronRight, ChevronsLeft, ChevronsRight,
    XCircle, MonitorPlay
} from "lucide-react"
import { lectureService } from "./lectureService"
import { Link } from "react-router-dom"

export default function LecturesPage() {
    const [lectures, setLectures] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8

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
        } finally {
            setLoading(false)
        }
    }

    const filteredLectures = useMemo(() => {
        return lectures.filter(lecture => 
            lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lecture.instructor && lecture.instructor.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (lecture.category_name && lecture.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }, [lectures, searchQuery])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const totalPages = Math.ceil(filteredLectures.length / itemsPerPage)
    const currentLectures = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage
        const firstIndex = lastIndex - itemsPerPage
        return filteredLectures.slice(firstIndex, lastIndex)
    }, [filteredLectures, currentPage])

    const goToPage = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 450, behavior: 'smooth' })
    }

    // Boje prilagođene tonu sa slike
    const getLevelColor = (level) => {
        switch (level) {
            case "Beginner": return "bg-blue-50 text-blue-600 border-blue-100"
            case "Intermediate": return "bg-indigo-50 text-indigo-600 border-indigo-100"
            case "Advanced": return "bg-slate-100 text-slate-800 border-slate-200"
            default: return "bg-gray-50 text-gray-600"
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f0f4f8]">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 font-medium animate-pulse">Loading Archive...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f0f2f5]"> {/* Pozadina sa slike */}
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">
                
                {/* Hero / Banner Area - Inspiriran stilom sa slike */}
                <div className="mb-10 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-32 bg-[#4461f2]" /> {/* Plavi header banner sa slike */}
                    <div className="p-8 md:p-10 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end w-full">
                            {/* Circle Icon umjesto Avatara */}
                            <div className="h-32 w-32 rounded-full bg-white p-2 shadow-md flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                    <MonitorPlay className="h-12 w-12 text-[#4461f2]" />
                                </div>
                            </div>
                            
                            <div className="flex-1 pb-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-bold text-slate-900">Archive Vault</h1>
                                    <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100 uppercase text-[10px] px-2 py-0.5">V3.0 Stable</Badge>
                                </div>
                                <p className="text-slate-500 font-medium">Curated Cybersecurity Intelligence</p>
                            </div>

                            {/* Search bar integriran kao "Action" na profilu */}
                            <div className="w-full md:w-[400px] relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search briefings..." 
                                    className="bg-slate-50 border-slate-200 h-12 pl-11 rounded-xl shadow-inner focus-visible:ring-[#4461f2]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <XCircle className="h-4 w-4 text-slate-300 hover:text-slate-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {filteredLectures.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-20 text-center shadow-sm">
                        <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">No briefings found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {currentLectures.map((lecture) => (
                                <Card key={lecture.id} className="group bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden flex flex-col">
                                    <div className="relative aspect-video bg-slate-100 overflow-hidden">
                                        {lecture.thumbnail_url ? (
                                            <img src={lecture.thumbnail_url} alt={lecture.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                <Youtube className="h-10 w-10 text-slate-400" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Badge className={`absolute top-3 left-3 border shadow-sm font-bold ${getLevelColor(lecture.level)}`}>
                                            {lecture.level}
                                        </Badge>
                                        
                                        <Link to={`/lectures/${lecture.id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                            <div className="h-12 w-12 rounded-full bg-[#4461f2] flex items-center justify-center shadow-lg">
                                                <Play className="h-5 w-5 text-white fill-current ml-0.5" />
                                            </div>
                                        </Link>
                                    </div>

                                    <CardHeader className="p-5 pb-3">
                                        <p className="text-[11px] font-bold text-[#4461f2] uppercase tracking-wider mb-1.5">
                                            {lecture.category_name || 'Cyber Intel'}
                                        </p>
                                        <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight min-h-[3rem]">
                                            {lecture.title}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="p-5 pt-0 mt-auto">
                                        <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold mb-5">
                                            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {lecture.views || 0}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {lecture.duration_minutes}m</span>
                                        </div>
                                        <Link to={`/lectures/${lecture.id}`}>
                                            <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 hover:text-[#4461f2] rounded-lg font-bold text-slate-700 h-10">
                                                View Briefing
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination - Čistiji stil */}
                        {totalPages > 1 && (
                            <div className="mt-12 flex justify-center">
                                <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                                        <ChevronsLeft className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                                    </Button>

                                    <div className="flex gap-1 px-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                            .map((page, index, array) => (
                                                <div key={page} className="flex gap-1">
                                                    {index > 0 && array[index - 1] !== page - 1 && <span className="flex items-center px-1 text-slate-300">...</span>}
                                                    <Button
                                                        variant={currentPage === page ? "default" : "ghost"}
                                                        className={`h-9 w-9 rounded-lg font-bold ${currentPage === page ? "bg-[#4461f2] text-white hover:bg-[#3b55d1]" : "text-slate-600 hover:bg-slate-50"}`}
                                                        onClick={() => goToPage(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                </div>
                                            ))}
                                    </div>

                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                        <ChevronRight className="h-4 w-4 text-slate-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                                        <ChevronsRight className="h-4 w-4 text-slate-600" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    )
}