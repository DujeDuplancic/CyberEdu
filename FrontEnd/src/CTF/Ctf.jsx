"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"

// UI & Icons
import { Input } from "../Components/ui/input"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import {
    Search, Flag, Target, ShieldCheck,
    XCircle, Trophy, Layers, Loader2,
    CheckCircle2, Flame
} from "lucide-react"

// Custom Components
import CategoryFilter from "./CategoryFilter"
import ChallengeList from "./ChallengeList"
import ChallengeModal from "./ChallengeModal"

export default function CTFPage() {
    const [challenges, setChallenges] = useState([])
    const [categories, setCategories] = useState([])
    const [activeCategory, setActiveCategory] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [loading, setLoading] = useState(true)
    const [selectedChallenge, setSelectedChallenge] = useState(null)

    // Stanje za Daily Goal widget - puni se asinkrono iz backend endpoint-a
    const [dailyGoal, setDailyGoal] = useState(null)

    const navigate = useNavigate()

    // --- INITIALIZATION ---
    useEffect(() => {
        window.scrollTo(0, 0)
        const initializeData = async () => {
            setLoading(true)
            // Daily goal dohvaćamo paralelno - widget se može pojaviti odmah
            await Promise.all([loadCategories(), loadChallenges(), loadDailyGoal()])
            setLoading(false)
        }
        initializeData()
    }, [])

    /**
     * Funkcija koja dohvaća dnevni cilj korisnika s backend-a.
     * Ako korisnik nije prijavljen, ne radi ništa (widget se sakriva).
     */
    const loadDailyGoal = async () => {
        try {
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null
            if (!user?.id) {
                setDailyGoal(null)
                return
            }

            const response = await fetch(
                `http://localhost/CyberEdu/Backend/challenges/get_daily_goal.php?user_id=${user.id}`
            )
            const data = await response.json()
            if (data.success) {
                setDailyGoal(data)
            }
        } catch (error) {
            console.error('Error loading daily goal:', error)
        }
    }

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost/CyberEdu/Backend/challenges/get_categories.php')
            const data = await response.json()
            if (data.success) setCategories(data.categories)
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const loadChallenges = async () => {
        try {
            const userData = localStorage.getItem('user')
            const user = userData ? JSON.parse(userData) : null
            const url = user 
                ? `http://localhost/CyberEdu/Backend/challenges/get_challenges.php?user_id=${user.id}`
                : 'http://localhost/CyberEdu/Backend/challenges/get_challenges.php'
            
            const response = await fetch(url)
            const data = await response.json()
            if (data.success) setChallenges(data.challenges)
        } catch (error) {
            console.error('Error loading challenges:', error)
        }
    }

    // --- FILTERING ---
    const filteredChallenges = useMemo(() => {
        return challenges.filter(challenge => {
            const matchesCategory = activeCategory === "all" || challenge.category_id.toString() === activeCategory
            const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 challenge.description?.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [challenges, activeCategory, searchQuery])

    // --- HANDLERS ---
    const handleAttemptChallenge = (challenge) => setSelectedChallenge(challenge)
    const handleCloseModal = () => setSelectedChallenge(null)

    // Pomjeranje "Solve" logike u modal, ovdje refreshamo listu I daily goal nakon uspjeha
    const onChallengeSolved = () => {
        loadChallenges()
        loadDailyGoal()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-[#f8fafc]">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Synchronizing_Vault...</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">
                
                {/* --- HERO SECTION (Muted Contrast) --- */}
                <div className="mb-10 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-indigo-500 to-blue-500 relative">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    </div>
                    
                    <div className="p-8 md:p-10 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
                        <div className="flex flex-col md:flex-row gap-6 items-end w-full">
                            {/* Avatar/Icon Container */}
                            <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-xl shadow-slate-200/40 flex-shrink-0">
                                <div className="w-full h-full rounded-2xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100">
                                    <Target className="h-12 w-12 text-indigo-500" />
                                </div>
                            </div>
                            
                            {/* Title & Info */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">CTF Challenges</h1>
                                    <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 uppercase text-[10px] px-2 py-0.5 font-bold tracking-wider">Live Vault</Badge>
                                </div>
                                <p className="text-slate-500 font-medium max-w-lg">
                                    Infiltrate systems, decrypt secrets, and climb the leaderboard.
                                </p>
                            </div>

                            {/* Integrated Search */}
                            <div className="w-full md:w-[380px] relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <Input 
                                    placeholder="Search target intelligence..." 
                                    className="bg-slate-50/50 border-slate-200 h-12 pl-11 rounded-xl shadow-sm focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <XCircle className="h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[280px_1fr] gap-8">
                    {/* --- SIDEBAR --- */}
                    <aside className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="flex items-center gap-2 mb-5 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em]">
                                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                                Domains
                            </div>
                            <CategoryFilter
                                categories={categories}
                                activeCategory={activeCategory}
                                onCategoryChange={setActiveCategory}
                            />
                        </div>

                        {/* Daily Goal widget - dinamički prati napredak korisnika */}
                        {dailyGoal && (() => {
                            // Dinamički subtitle ovisno o stanju cilja
                            const subtitle = dailyGoal.completed
                                ? "Goal smashed - great job!"
                                : dailyGoal.remaining === 1
                                    ? "Solve 1 more today!"
                                    : `Solve ${dailyGoal.remaining} more today!`

                            // Boja kartice - kad je cilj postignut, prelazimo na zelenu (emerald)
                            const gradient = dailyGoal.completed
                                ? "from-emerald-500 to-emerald-600 shadow-emerald-100"
                                : "from-indigo-600 to-indigo-700 shadow-indigo-100"

                            return (
                                <div className={`bg-gradient-to-br ${gradient} p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group`}>
                                    {/* Pozadinska ikona - mijenja se ovisno o ispunjenju cilja */}
                                    {dailyGoal.completed ? (
                                        <CheckCircle2 className="absolute -right-2 -bottom-2 h-20 w-20 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <Trophy className="absolute -right-2 -bottom-2 h-20 w-20 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                                    )}

                                    <div className="flex items-center justify-between relative z-10">
                                        <h4 className="font-bold text-lg">Daily Goal</h4>
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/15 backdrop-blur-sm px-2 py-1 rounded-md">
                                            {dailyGoal.solves_today}/{dailyGoal.goal}
                                        </span>
                                    </div>

                                    <p className="text-white/90 text-sm mt-1 relative z-10 font-medium">
                                        {subtitle}
                                    </p>

                                    {/* Progress bar - širina se računa iz progress_pct */}
                                    <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative z-10">
                                        <div
                                            className="h-full bg-white rounded-full shadow-[0_0_8px_white] transition-all duration-700"
                                            style={{ width: `${dailyGoal.progress_pct}%` }}
                                        />
                                    </div>

                                    {/* Streak badge - prikazuje se samo ako je niz aktivan (>=1 dan) */}
                                    {dailyGoal.streak_days > 0 && (
                                        <div className="mt-4 flex items-center gap-1.5 relative z-10 text-[11px] font-bold uppercase tracking-wider text-white/90">
                                            <Flame className="h-3.5 w-3.5" />
                                            {dailyGoal.streak_days}-day streak
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </aside>

                    {/* --- CHALLENGE GRID --- */}
                    <section>
                        {filteredChallenges.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-20 text-center shadow-sm">
                                <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="h-10 w-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">No Challenges Found</h3>
                                <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-widest">Query mismatch: {searchQuery}</p>
                                <Button 
                                    variant="outline" 
                                    className="mt-8 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-8"
                                    onClick={() => {setSearchQuery(""); setActiveCategory("all")}}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            <ChallengeList
                                challenges={challenges}
                                filteredChallenges={filteredChallenges}
                                activeCategory={activeCategory}
                                onAttemptChallenge={handleAttemptChallenge}
                            />
                        )}
                    </section>
                </div>

                {/* --- MODAL --- */}
                {selectedChallenge && (
                    <ChallengeModal
                        challenge={selectedChallenge}
                        isSolved={selectedChallenge.solved} // Pretpostavka da backend vraća solved boolean
                        onClose={handleCloseModal}
                        onSolve={onChallengeSolved}
                    />
                )}
            </main>
            <Footer />
        </div>
    )
}