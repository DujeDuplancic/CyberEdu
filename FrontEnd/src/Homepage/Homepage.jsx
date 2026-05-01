import { useState, useEffect } from 'react';
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Button } from "../Components/ui/button"
import { Lock, Code, Key, ImageIcon, Globe, Trophy, Users, BookOpen, ChevronRight, Search, Smartphone, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import cyberSecCodeEditor from '../public/cybersecurity-code-editor-terminal-hacking.jpg'
import { api } from '../lib/api';

// Konfiguracija vizualnih stilova za kategorije
const categoryConfig = {
  'Cryptography': { icon: Key, color: 'text-purple-500', bg: 'bg-purple-50', border: 'hover:border-purple-200', glow: 'group-hover:shadow-purple-100' },
  'Steganography': { icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50', border: 'hover:border-pink-200', glow: 'group-hover:shadow-pink-100' },
  'Web Security': { icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-200', glow: 'group-hover:shadow-blue-100' },
  'Reverse Engineering': { icon: Code, color: 'text-green-500', bg: 'bg-green-50', border: 'hover:border-green-200', glow: 'group-hover:shadow-green-100' },
  'Binary Exploitation': { icon: Lock, color: 'text-red-500', bg: 'bg-red-50', border: 'hover:border-red-200', glow: 'group-hover:shadow-red-100' },
  'Mobile Security': { icon: Smartphone, color: 'text-orange-500', bg: 'bg-orange-50', border: 'hover:border-orange-200', glow: 'group-hover:shadow-orange-100' },
  'OSINT': { icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'hover:border-cyan-200', glow: 'group-hover:shadow-cyan-100' },
};

export default function HomePage() {
  const [stats, setStats] = useState({ activeChallenges: 0, activeUsers: 0, videoLectures: 0, flagsCaptured: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHomepageData(); }, []);

  const fetchHomepageData = async () => {
    try {
      const statsRes = await api.get('/homepage/get_stats.php');
      if (statsRes.success) setStats(statsRes.stats);
      const catRes = await api.get('/homepage/get_categories.php');
      if (catRes.success) setCategories(catRes.categories);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col font-sans">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="container mx-auto px-4 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold tracking-widest uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-Gen Learning Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Elevate Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Cyber Skills</span>
            </h1>
            
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Hands-on challenges in a professional lab environment. Master the art of hacking through structured learning paths.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
              <Button size="xl" className="rounded-full shadow-lg shadow-primary/20 px-8 text-lg hover:scale-105 transition-transform" asChild>
                <Link to="/register">Start Hacking Now</Link>
              </Button>
              <Button size="xl" variant="outline" className="rounded-full px-8 text-lg bg-white/50 backdrop-blur-sm" asChild>
                <Link to="/ctf">View Challenges</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CATEGORIES GRID */}
        <section className="bg-white border-y border-slate-100 py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-left">Challenge Categories</h2>
                <p className="text-lg text-slate-500 text-left">Browse our specialized labs designed to take you from script kiddie to professional operator.</p>
              </div>
              <Button variant="ghost" className="text-primary font-bold" asChild>
                <Link to="/ctf">View all 5 categories <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((cat) => {
                  const config = categoryConfig[cat.name] || { icon: Code, color: 'text-slate-500', bg: 'bg-slate-50', border: 'hover:border-slate-200', glow: '' };
                  const Icon = config.icon;
                  
                  return (
                    <div key={cat.name} className={`group relative bg-white border border-slate-100 rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${config.border} ${config.glow}`}>
                      <div className={`w-16 h-16 ${config.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className={`h-8 w-8 ${config.color}`} strokeWidth={1.5} />
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-slate-900">{cat.name}</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
                          {cat.challenge_count || 0}
                        </span>
                      </div>
                      
                      <p className="text-slate-500 leading-relaxed mb-8 min-h-[3rem]">
                        {cat.description}
                      </p>
                      
                      <Link 
                        to={`/ctf?category=${encodeURIComponent(cat.name)}`}
                        className={`inline-flex items-center font-bold ${config.color} group/btn`}
                      >
                        Explore Lab <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:ml-3 transition-all" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-32 container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
              <img src={cyberSecCodeEditor} alt="Dashboard" className="rounded-[2.5rem] shadow-2xl border border-slate-200 relative z-10" />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 z-20 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 font-medium">New Record!</div>
                    <div className="text-lg font-bold text-slate-900">Top 1% Worldwide</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-12 order-1 lg:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight text-left">Why Choose Our Academy?</h2>
              <div className="space-y-8">
                {[
                  { icon: Trophy, title: "Industry Standard CTF", desc: "Our platform mimics real-world enterprise environments and bug bounty targets.", color: "text-amber-500", bg: "bg-amber-50" },
                  { icon: BookOpen, title: "Guided Learning", desc: "Follow our step-by-step lectures that explain the 'why' behind each exploit.", color: "text-blue-500", bg: "bg-blue-50" },
                  { icon: Users, title: "Collaborative Ecosystem", desc: "Access community writeups and private discord channels for each challenge.", color: "text-purple-500", bg: "bg-purple-50" }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className={`shrink-0 w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center ${f.color} group-hover:rotate-6 transition-transform`}>
                      <f.icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 text-left">{f.title}</h3>
                      <p className="text-slate-500 leading-relaxed text-left">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DARK STATS COUNTER */}
        <section className="container mx-auto px-4 pb-32">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-16 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent"></div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 relative z-10">
              {[
                { label: "Active Labs", val: stats.activeChallenges },
                { label: "Operators", val: stats.activeUsers },
                { label: "Lectures", val: stats.videoLectures },
                { label: "Flags Captured", val: stats.flagsCaptured }
              ].map((s, i) => (
                <div 
                  key={i} 
                  className={`relative py-8 px-4 flex flex-col items-center justify-center
                    ${i !== 3 ? "lg:border-r lg:border-white/10" : ""} 
                    ${i % 2 === 0 ? "border-r border-white/5 lg:border-none" : ""}`}
                >
                  <div className="text-4xl md:text-6xl font-extrabold text-white mb-3 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    {loading ? <span className="opacity-20 animate-pulse">00</span> : (s.val >= 1000 ? (s.val / 1000).toFixed(1) + 'k+' : s.val)}
                  </div>
                  <div className="text-blue-400 font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs">
                    {s.label}
                  </div>
                  <div className="mt-4 h-1 w-8 bg-primary/30 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}