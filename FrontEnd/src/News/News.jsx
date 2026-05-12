"use client"

import { useEffect, useState, useMemo } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Newspaper, Search, RefreshCw, ExternalLink, AlertCircle, Calendar, Globe, Loader2 } from "lucide-react"

// Konstanta s URL-om backend endpoint-a koji vraća objedinjeni JSON svih feed-ova
const API_URL = "http://localhost/CyberEdu/Backend/news/get_news.php"

// Mapa izvora -> ljudski naziv i boja badge-a, koristi se za filter i prikaz na kartici
const SOURCE_META = {
  thehackernews:    { name: "The Hacker News",    color: "bg-red-50 text-red-600 border-red-100" },
  bleepingcomputer: { name: "BleepingComputer",   color: "bg-orange-50 text-orange-600 border-orange-100" },
  krebs:            { name: "Krebs on Security",  color: "bg-blue-50 text-blue-600 border-blue-100" }
}

// Lista izvora za filter ("All" + pojedinačni izvori iz mape gore)
const SOURCE_FILTERS = [
  { key: "all", label: "All Sources" },
  ...Object.entries(SOURCE_META).map(([key, meta]) => ({ key, label: meta.name }))
]

export default function NewsPage() {
  // Stanje članaka, učitavanja, greške, filtera i pretrage
  const [articles, setArticles]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState(null)
  const [selectedSource, setSelectedSource] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [cachedAt, setCachedAt]   = useState(null)

  // Scroll na vrh stranice pri ulasku - konzistentno s ostalim stranicama
  useEffect(() => {
    window.scrollTo(0, 0)
    fetchNews(false)
  }, [])

  /**
   * Glavna funkcija koja dohvaća vijesti s backend-a.
   * Ako je proslijeđen forceRefresh=true, šalje query param ?refresh=1
   * koji govori backend-u da preskoči cache.
   */
  const fetchNews = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const url = forceRefresh ? `${API_URL}?refresh=1&_=${Date.now()}` : API_URL
      const response = await fetch(url)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch news")
      }

      setArticles(data.articles || [])
      setCachedAt(data.cached_at || null)
    } catch (err) {
      console.error("News fetch error:", err)
      setError(err.message || "Network error while loading news.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  /**
   * Memoizirano filtriranje članaka po odabranom izvoru i tekstualnoj pretrazi.
   * Pretraga se vrši po naslovu i opisu, case-insensitive.
   */
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return articles.filter((a) => {
      const matchesSource = selectedSource === "all" || a.source === selectedSource
      if (!matchesSource) return false
      if (!q) return true
      return (
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      )
    })
  }, [articles, selectedSource, searchQuery])

  /**
   * Pomoćna funkcija koja datum iz ISO formata pretvara u
   * "relativno vrijeme" (npr. "2h ago", "3d ago") za čišći prikaz na karticama.
   */
  const formatRelativeTime = (iso) => {
    if (!iso) return ""
    const date = new Date(iso)
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diffSec < 60) return "just now"
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-12 py-12">

        {/* Naslovni blok stranice - isti vizualni stil kao ostale stranice (Contact/Assistant) */}
        <div className="mb-10 border-b border-slate-200 pb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <Newspaper className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                  Cybersecurity News
                </h1>
                <p className="text-slate-500 mt-2 text-lg max-w-3xl">
                  Latest threats, vulnerabilities and industry headlines - aggregated from trusted sources.
                </p>
              </div>
            </div>

            {/* Gumb za ručno osvježavanje feed-a (zaobilazi backend cache) */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => fetchNews(true)}
              disabled={loading || refreshing}
              className="gap-2 self-start md:self-auto"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Indikator vremena zadnjeg cache-a, prikazuje se samo ako postoji */}
          {cachedAt && (
            <p className="text-xs text-slate-400 mt-4 font-mono">
              Last updated: {new Date(cachedAt).toLocaleString("en-US")}
            </p>
          )}
        </div>

        {/* Filter izvora + tražilica - sticky bar iznad mreže */}
        <div className="mb-8 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">

          {/* Source filter chips */}
          <div className="flex flex-wrap gap-2">
            {SOURCE_FILTERS.map((f) => {
              const isActive = selectedSource === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSelectedSource(f.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Search input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search headlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200 h-11"
            />
          </div>
        </div>

        {/* Stanje učitavanja - skeleton kartice u boji aplikacije */}
        {loading && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} className="border-none shadow-md bg-white overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-100" />
                <CardHeader>
                  <div className="h-3 bg-slate-100 rounded w-24 mb-3" />
                  <div className="h-5 bg-slate-200 rounded w-full mb-2" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stanje greške - kartica s opisom */}
        {!loading && error && (
          <Card className="border-none shadow-md bg-destructive/5">
            <CardContent className="flex items-center gap-4 py-8">
              <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg text-destructive mb-1">Failed to load news</CardTitle>
                <CardDescription>{error}</CardDescription>
              </div>
              <Button variant="outline" className="ml-auto" onClick={() => fetchNews(true)}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stanje prazne pretrage - korisnik je filtrirao na nešto bez rezultata */}
        {!loading && !error && filteredArticles.length === 0 && (
          <Card className="border-none shadow-md bg-white">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Newspaper className="h-12 w-12 text-slate-300" />
              <CardTitle className="text-xl text-slate-700">No articles match your filters</CardTitle>
              <CardDescription>Try a different source or clear the search field.</CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Glavna mreža kartica s vijestima */}
        {!loading && !error && filteredArticles.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredArticles.map((article, idx) => {
              const meta = SOURCE_META[article.source] || { name: article.source_name, color: "bg-slate-50 text-slate-600 border-slate-200" }
              return (
                <Card
                  key={`${article.source}-${idx}-${article.link}`}
                  className="border-none shadow-md bg-white overflow-hidden group flex flex-col hover:shadow-xl transition-all"
                >
                  {/* Top accent bar - isti pattern kao Contact info kartice */}
                  <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />

                  {/* Slika članka ako postoji */}
                  {article.image ? (
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none" }}
                      />
                    </div>
                  ) : (
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Newspaper className="h-16 w-16 text-primary/30" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs font-medium ${meta.color}`}>
                        <Globe className="h-3 w-3 mr-1" />
                        {meta.name}
                      </Badge>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(article.published_at)}
                      </span>
                    </div>
                    <CardTitle className="text-lg leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pb-4 flex-1 flex flex-col">
                    <CardDescription className="line-clamp-3 mb-4 flex-1">
                      {article.description}
                    </CardDescription>

                    {/* Vanjski link otvara članak u novoj kartici - rel="noopener" iz sigurnosnih razloga */}
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all"
                    >
                      Read full article
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Brojač rezultata na dnu - pomoć korisniku za snalaženje */}
        {!loading && !error && filteredArticles.length > 0 && (
          <p className="text-center text-sm text-slate-400 mt-10">
            Showing {filteredArticles.length} of {articles.length} articles
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}
