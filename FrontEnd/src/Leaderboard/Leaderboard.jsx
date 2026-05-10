"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Button } from "../Components/ui/button"
import { 
  Trophy, Medal, Award, Loader2, Target,
  ChevronLeft, ChevronRight, Search 
} from "lucide-react"

export default function LeaderboardPage() {
  const [data, setData] = useState({ top: [], others: [], categories: [] })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const API_BASE = 'http://localhost/CyberEdu/Backend/'

  // Helper function to get full avatar URL
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return ""
    if (avatarPath.startsWith('http')) return avatarPath
    if (avatarPath.startsWith('/')) return `${API_BASE.slice(0, -1)}${avatarPath}`
    return `${API_BASE}${avatarPath}`
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE}challenges/get_categories.php`)
        const json = await res.json()
        if (json.success) setData(prev => ({ ...prev, categories: json.categories }))
      } catch (err) { console.error("Error:", err) }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        let url = `${API_BASE}leaderboard/get_leaderboard.php`
        if (selectedCategory) url += `?category_id=${selectedCategory}`
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          const users = json.leaderboard || []
          // Process users to ensure profile_image is properly formatted
          const processedUsers = users.map(user => ({
            ...user,
            profile_image: user.avatar_url || user.profile_image || null
          }))
          setData(prev => ({ 
            ...prev, 
            top: processedUsers.slice(0, 3), 
            others: processedUsers.slice(3) 
          }))
        }
      } catch (err) { console.error("Error:", err) }
      finally { setLoading(false) }
    }
    fetchLeaderboard()
    setCurrentPage(1) 
  }, [selectedCategory])

  const paginatedOthers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return data.others.slice(start, start + itemsPerPage)
  }, [data.others, currentPage])

  const totalPages = Math.ceil(data.others.length / itemsPerPage)

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="h-7 w-7 text-yellow-500" />
      case 2: return <Medal className="h-7 w-7 text-slate-400" />
      case 3: return <Award className="h-7 w-7 text-amber-700" />
      default: return <span className="font-mono font-bold text-slate-400 text-lg">#{rank}</span>
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">
        
        {/* --- HERO BANNER --- */}
        <div className="mb-12 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-[#4461f2] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ 
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }}></div>
          </div>
          
          <div className="p-8 md:p-10 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-end w-full">
              <div className="h-32 w-32 rounded-2xl bg-white p-2 shadow-md flex-shrink-0 border border-slate-100">
                <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Target className="h-12 w-12 text-[#4461f2]" />
                </div>
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hall of Fame</h1>
                  <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100 uppercase text-[10px] px-2.5 py-1 font-bold">
                    Live Ranks
                  </Badge>
                </div>
                <p className="text-slate-500 font-medium max-w-xl">
                  Ranking the most skilled security researchers and elite operators in our ecosystem.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-10 pb-2 mr-4">
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
                  <p className="text-xl font-black text-slate-800">{data.top.length + data.others.length}</p>
                </div>
                <div className="h-8 w-[1px] bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Solves</p>
                  <p className="text-xl font-black text-slate-800">
                    {data.top.reduce((acc, u) => acc + parseInt(u.total_solves || 0), 0) + data.others.reduce((acc, u) => acc + parseInt(u.total_solves || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-10 px-2">
          <Button 
            variant={selectedCategory === null ? "default" : "secondary"}
            onClick={() => setSelectedCategory(null)}
            className={`rounded-xl px-6 font-bold transition-all ${selectedCategory === null ? 'bg-[#4461f2] hover:bg-[#3651d4] shadow-lg shadow-blue-200' : 'bg-white border-slate-200'}`}
          >
            All Categories
          </Button>
          {data.categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "secondary"}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-6 font-bold transition-all ${selectedCategory === cat.id ? 'bg-[#4461f2] hover:bg-[#3651d4] shadow-lg shadow-blue-200' : 'bg-white border-slate-200'}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#4461f2]" />
            <p className="font-bold text-slate-400 animate-pulse font-mono tracking-widest uppercase text-xs">Initializing_Rank_Matrix...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Podium - Top 3 */}
            <div className="grid gap-8 md:grid-cols-3">
              {data.top.map((user, idx) => (
                <Card key={user.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white group rounded-3xl overflow-hidden transform hover:-translate-y-2">
                  <div className={`h-2 ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-600'}`} />
                  <CardContent className="pt-10 pb-8">
                    <div className="flex flex-col items-center space-y-5">
                      <div className="p-3 bg-slate-50 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                        {getRankIcon(idx + 1)}
                      </div>
                      <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                        <AvatarImage 
                          src={getAvatarUrl(user.profile_image)} 
                          alt={user.username}
                        />
                        <AvatarFallback className="text-3xl font-black bg-slate-100 text-slate-400">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">{user.username}</CardTitle>
                        <div className="mt-3">
                          <Badge className="bg-blue-50 text-[#4461f2] border-none px-6 py-1.5 text-sm font-black rounded-xl">
                            {user.total_points} EXP
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-3xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] w-32 text-center">Rank</th>
                      <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator</th>
                      <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedOthers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-10 py-6 text-center font-mono font-bold text-slate-400">
                          #{user.rank}
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                              <AvatarImage 
                                src={getAvatarUrl(user.profile_image)} 
                                alt={user.username}
                              />
                              <AvatarFallback className="bg-slate-100 font-bold text-slate-400">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-lg font-black text-slate-800 group-hover:text-[#4461f2] transition-colors tracking-tight">{user.username}</p>
                              <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{user.total_solves} Solves</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <span className="text-xl font-black text-slate-800 tracking-tighter bg-slate-100/50 px-4 py-2 rounded-xl">
                            {user.total_points}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-10 py-8 border-t border-slate-100 bg-slate-50/30">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Sector: {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => prev - 1)
                        window.scrollTo({ top: 300, behavior: 'smooth' })
                      }}
                      className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest px-5 shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => prev + 1)
                        window.scrollTo({ top: 300, behavior: 'smooth' })
                      }}
                      className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest px-5 shadow-sm"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}