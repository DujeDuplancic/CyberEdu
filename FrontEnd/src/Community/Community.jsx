"use client"

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { 
  MessageSquare, TrendingUp, Plus, Search, 
  Users, Activity, RotateCcw, ChevronLeft, ChevronRight 
} from "lucide-react"
import { Input } from "../Components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select"
import DiscussionCard from './DiscussionCard';
import { api } from '../lib/api';
import { Badge } from "../Components/ui/badge"

const CATEGORIES = ['All', 'General', 'Reverse Engineering', 'Cryptography', 'Binary Exploitation', 'Web Security', 'Forensics', 'Steganography', 'Writeups', 'Questions', 'Tools'];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTopics: 0, activeMembers: 0, totalPosts: 0, thisWeekTopics: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ category: 'All', search: '' });

  const fetchDiscussions = useCallback(async () => {
    setLoading(true);
    try {
      let query = `?page=${pagination.page}&limit=${pagination.limit}`;
      if (filters.category !== 'All') query += `&category=${encodeURIComponent(filters.category)}`;
      if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
      
      const res = await api.get(`/discussions/get_discussions.php${query}`);
      if (res.success) {
        setDiscussions(res.discussions);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStats = async () => {
    try {
      const [topicsRes, repliesRes] = await Promise.all([
        api.get('/discussions/get_discussions.php?limit=1000'),
        api.get('/discussions/get_replies.php?limit=1')
      ]);

      if (topicsRes.success) {
        const totalTopics = topicsRes.pagination?.total || 0;
        const totalReplies = repliesRes.pagination?.total || 0;
        const uniqueAuthors = new Set(topicsRes.discussions?.map(d => d.author_id)).size;
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeek = topicsRes.discussions?.filter(d => new Date(d.created_at) > oneWeekAgo).length || 0;

        setStats({
          totalTopics,
          totalPosts: totalTopics + totalReplies,
          activeMembers: Math.max(1, uniqueAuthors),
          thisWeekTopics: thisWeek
        });
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  useEffect(() => {
    fetchDiscussions();
    fetchStats();
  }, [fetchDiscussions]);

  const refresh = () => { fetchDiscussions(); fetchStats(); };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">
        
        {/* --- HERO BANNER (UOKVIRENI STIL) --- */}
        <div className="mb-10 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Plavi vrh s uzorkom */}
          <div className="h-32 bg-[#4461f2] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ 
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }}></div>
          </div>
          
          {/* Sadržaj bannera */}
          <div className="p-8 md:p-10 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-end w-full">
              {/* Ikona foruma */}
              <div className="h-32 w-32 rounded-2xl bg-white p-2 shadow-md flex-shrink-0 border border-slate-100">
                <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <MessageSquare className="h-12 w-12 text-[#4461f2]" />
                </div>
              </div>
              
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Community Forum</h1>
                  <Badge className="bg-blue-100 text-blue-700 border-none hover:bg-blue-100 uppercase text-[10px] px-2.5 py-1 font-bold">
                    Intel Exchange
                  </Badge>
                </div>
                <p className="text-slate-500 font-medium max-w-xl">
                  The hub for knowledge sharing, writeups, and strategic cybersecurity discussions.
                </p>
              </div>

              {/* Akcijski gumbi i Stats */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-2">
                 {/* Mini Stats unutar Hero dijela */}
                <div className="hidden lg:flex items-center gap-6 mr-6">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Topics</p>
                    <p className="text-xl font-black text-slate-800">{stats.totalTopics}</p>
                  </div>
                  <div className="h-8 w-[1px] bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Members</p>
                    <p className="text-xl font-black text-slate-800">{stats.activeMembers}</p>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate('/community/new')} 
                  className="bg-[#4461f2] hover:bg-[#3651d4] text-white font-bold rounded-xl px-6 py-6 shadow-lg shadow-blue-200 gap-2 transition-all transform hover:-translate-y-1"
                >
                  <Plus className="h-5 w-5" /> New Discussion
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- STATS CARDS (GRID) --- */}
        <div className="grid gap-6 sm:grid-cols-3 mb-10">
          {[
            { label: "Total Topics", val: stats.totalTopics, sub: `${stats.thisWeekTopics} new this week`, icon: MessageSquare },
            { label: "Active Members", val: stats.activeMembers, sub: "Verified operators", icon: Users, isOnline: true },
            { label: "Total Posts", val: stats.totalPosts, sub: "Collective intel", icon: TrendingUp }
          ].map((s, i) => (
            <Card key={i} className="border-none shadow-sm bg-white rounded-2xl group hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                    <s.icon className="h-5 w-5 text-[#4461f2]" />
                  </div>
                  {s.isOnline && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Live</span>
                    </div>
                  )}
                </div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</h3>
                <p className="text-3xl font-black text-slate-800 mb-1">{s.val}</p>
                <p className="text-xs font-medium text-slate-500">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --- FILTERS --- */}
        <Card className="border-none shadow-sm bg-white rounded-2xl mb-8 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search intelligence..." 
                  className="pl-11 py-6 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-[#4461f2] font-medium"
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              <Select value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v }))}>
                <SelectTrigger className="w-full md:w-64 py-6 bg-slate-50 border-none rounded-xl font-bold text-slate-700">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="font-medium">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                onClick={() => setFilters({ category: 'All', search: '' })} 
                className="rounded-xl hover:bg-slate-100 h-12 w-12 p-0 text-slate-400"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- FEED --- */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-[#4461f2] rounded-full"></div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                Recent Feed
              </h2>
            </div>
            <Badge variant="outline" className="border-slate-200 text-slate-400 font-mono font-bold">
              REC_COUNT: {pagination.total}
            </Badge>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 border-4 border-[#4461f2] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing_Data_Streams...</p>
            </div>
          ) : discussions.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-transparent rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">No intelligence found</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto mb-8">Try adjusting your filters or start a brand new tactical discussion.</p>
                <Button 
                  onClick={() => navigate('/community/new')}
                  className="bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 rounded-xl px-8"
                >
                  Start a Discussion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {discussions.map(d => <DiscussionCard key={d.id} discussion={d} onUpdate={refresh} />)}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-10">
              <Button 
                variant="outline" 
                disabled={pagination.page === 1} 
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest px-6 h-11"
              >
                <ChevronLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <div className="bg-white border border-slate-200 px-6 py-2.5 rounded-xl text-sm font-black text-slate-700 shadow-sm">
                {pagination.page} <span className="text-slate-300 mx-1">/</span> {pagination.pages}
              </div>
              <Button 
                variant="outline" 
                disabled={pagination.page === pagination.pages} 
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest px-6 h-11"
              >
                Next <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}