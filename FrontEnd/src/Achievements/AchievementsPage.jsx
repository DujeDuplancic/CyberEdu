"use client"

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { Trophy, Lock, Unlock, TrendingUp, Award, Star, Calendar, RotateCcw } from "lucide-react"
import { api } from '../lib/api'
import { useNotifications } from '../contexts/NotificationContext'

export default function AchievementsPage() {
  const navigate = useNavigate()
  const { showAchievement, showSuccess, showError } = useNotifications()
  
  const [data, setData] = useState({ achievements: [], stats: null })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [user, setUser] = useState(null)

  // Centralizirani fetch podataka
  const fetchAllData = useCallback(async (uid) => {
    try {
      const [achRes, statsRes] = await Promise.all([
        api.get(`/achievements/get_achievements.php?user_id=${uid}`),
        api.get(`/achievements/get_user_stats.php?user_id=${uid}`)
      ])
      if (achRes.success && statsRes.success) {
        setData({ achievements: achRes.achievements, stats: statsRes.stats })
      }
    } catch (err) {
      showError('Failed to sync achievements')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) return navigate('/login')
    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    fetchAllData(parsedUser.id)
  }, [navigate, fetchAllData])

  const checkNewAchievements = async () => {
    try {
      const res = await api.get(`/achievements/get_achievements.php?action=check&user_id=${user.id}`)
      if (res.success && res.new_achievements?.length > 0) {
        res.new_achievements.forEach(a => showAchievement({
          name: a.name, description: a.description, points_reward: a.points_reward || 0
        }))
        fetchAllData(user.id)
      } else {
        showSuccess('No new unlocks found. Keep hacking!', 'Status')
      }
    } catch (err) { showError('Check failed') }
  }

  const filteredAchievements = data.achievements.filter(a => {
    if (activeTab === 'unlocked') return a.unlocked
    if (activeTab === 'locked') return !a.unlocked
    return true
  })

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing_Achievements...</p>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">
        
        {/* --- MODERN HERO BANNER --- */}
        <div className="mb-10 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-[#4461f2] relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>
          
          <div className="p-8 md:p-10 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-end w-full">
              <div className="h-32 w-32 rounded-2xl bg-white p-2 shadow-md border border-slate-100 shrink-0">
                <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Trophy className="h-12 w-12 text-[#4461f2]" />
                </div>
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Achievements</h1>
                  <Badge className="bg-blue-100 text-blue-700 border-none uppercase text-[10px] px-2.5 py-1 font-bold">Milestones</Badge>
                </div>
                <p className="text-slate-500 font-medium max-w-xl">Track your tactical progress and unlock elite badges for your profile.</p>
              </div>

              <Button 
                onClick={checkNewAchievements}
                className="bg-[#4461f2] hover:bg-[#3651d4] text-white font-bold rounded-xl px-6 py-6 shadow-lg shadow-blue-200 gap-2 transition-all"
              >
                <RotateCcw className="h-4 w-4" /> Sync Progress
              </Button>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid gap-6 md:grid-cols-4 mb-10">
          <StatCard label="Unlocked" val={`${data.stats?.unlocked}/${data.stats?.total}`} sub={`${data.stats?.percentage}% Complete`} icon={TrendingUp} />
          <StatCard label="Recent" val={data.stats?.recent_unlocks.length} sub="Last 30 days" icon={Calendar} />
          <StatCard label="Categories" val={data.stats?.category_stats.length} sub="Specializations" icon={Award} />
          <StatCard label="Total XP" val={data.achievements.reduce((acc, a) => acc + (a.unlocked ? parseInt(a.points_reward) : 0), 0)} sub="From Achievements" icon={Star} />
        </div>

        {/* --- FILTERS --- */}
        <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
          {['all', 'unlocked', 'locked'].map((t) => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(t)}
              className={`rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-500'}`}
            >
              {t}
            </Button>
          ))}
        </div>

        {/* --- ACHIEVEMENTS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((a) => (
            <Card key={a.id} className={`border-none shadow-sm rounded-3xl overflow-hidden transition-all group hover:shadow-xl ${!a.unlocked && 'opacity-70'}`}>
              <div className={`h-1.5 ${a.unlocked ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              <CardHeader className="pt-6">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-2xl ${a.unlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {a.unlocked ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                  </div>
                  <Badge variant="outline" className="font-black text-[#4461f2] border-blue-100 bg-blue-50/50">+{a.points_reward} XP</Badge>
                </div>
                <CardTitle className="text-xl font-black text-slate-800 mt-4 tracking-tight">{a.name}</CardTitle>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mt-2">{a.description}</p>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requirement</p>
                  <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    {a.criteria_type === 'solves_count' ? <Trophy className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                    Solve {a.criteria_value} {a.category_name || 'Total'} Challenges
                  </p>
                </div>
                {a.unlocked && (
                  <p className="text-[10px] font-bold text-emerald-600 mt-4 flex items-center gap-1 uppercase tracking-tighter">
                    <Calendar className="h-3 w-3" /> Unlocked: {a.unlocked_at_formatted}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Pomoćna komponenta za Stat kartice
function StatCard({ label, val, sub, icon: Icon }) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-50 rounded-lg"><Icon className="h-5 w-5 text-[#4461f2]" /></div>
        </div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h3>
        <p className="text-3xl font-black text-slate-800 mb-1">{val}</p>
        <p className="text-xs font-medium text-slate-500">{sub}</p>
      </CardContent>
    </Card>
  )
}