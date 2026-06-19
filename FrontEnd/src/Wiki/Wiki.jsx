"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Header } from "@/Components/Header"
import { Footer } from "@/Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/Components/ui/badge"
import { 
    Lock, Code, Key, ImageIcon, Globe, 
    BookOpen, Loader2, ChevronRight, MonitorPlay, Search, X 
} from "lucide-react"

// --- KONFIGURACIJA IKONA ---
const ICON_MAP = {
    'Code': Code, 
    'Lock': Lock, 
    'Key': Key, 
    'ImageIcon': ImageIcon, 
    'Globe': Globe,
    'Reverse Engineering': Code, 
    'Binary Exploitation': Lock, 
    'Cryptography': Key, 
    'Steganography': ImageIcon, 
    'Web Security': Globe
};

export default function WikiPage() {
    const [data, setData] = useState({ categories: [], articles: [] });
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchWikiData();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredArticles(data.articles);
            setSearching(false);
        } else {
            setSearching(true);
            const filtered = data.articles.filter(article => 
                article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.content?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredArticles(filtered);
        }
    }, [searchQuery, data.articles]);

    const fetchWikiData = async () => {
        try {
            const [catRes, artRes] = await Promise.all([
                fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_categories.php'),
                fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_articles.php?limit=5')
            ]);

            const [catData, artData] = await Promise.all([catRes.json(), artRes.json()]);

            setData({
                categories: catData.success ? catData.categories : [],
                articles: artData.success ? artData.articles : []
            });
            setFilteredArticles(artData.success ? artData.articles : []);
        } catch (error) {
            console.error('❌ Wiki API Error:', error);
            setData({ categories: [], articles: [] });
            setFilteredArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const getCategoryIcon = (category) => {
        const Icon = ICON_MAP[category.icon] || ICON_MAP[category.name] || BookOpen;
        return <Icon className="h-8 w-8 text-indigo-500 mb-3 group-hover:scale-110 transition-transform duration-300" />;
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen flex flex-col bg-[#f8fafc]">
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-10 py-10">
                
                {/* --- HERO BANNER (S MARGINAMA) --- */}
                <div className="mb-12 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Plavi dio bannera */}
                    <div className="h-32 bg-[#4461f2] relative overflow-hidden">
                         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                    </div>
                    
                    {/* Donji dio sa sadržajem i profilnom ikonom */}
                    <div className="p-8 md:p-10 -mt-16 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
                        <div className="flex flex-col md:flex-row gap-6 items-end w-full">
                            {/* Circle Icon - "Avatar" sekcije */}
                            <div className="h-32 w-32 rounded-2xl bg-white p-2 shadow-md flex-shrink-0 border border-slate-100">
                                <div className="w-full h-full rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <BookOpen className="h-12 w-12 text-[#4461f2]" />
                                </div>
                            </div>
                            
                            <div className="flex-1 pb-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cyber Library</h1>
                                    <Badge className="bg-indigo-100 text-indigo-700 border-none hover:bg-indigo-100 uppercase text-[10px] px-2.5 py-1 font-bold">
                                        Knowledge Base
                                    </Badge>
                                </div>
                                <p className="text-slate-500 font-medium max-w-xl">
                                    Master the arts of exploitation and defense through curated technical documentation and intel reports.
                                </p>
                            </div>

                            {/* Search bar integriran desno */}
                            <div className="w-full md:w-[400px] relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input 
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    placeholder="Search library intelligence..." 
                                    className="w-full bg-slate-50 border border-slate-200 h-12 pl-11 pr-11 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-[#4461f2]/20 transition-all font-medium text-slate-600"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- KATEGORIJE GRID --- */}
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Intel Domains</h2>
                </div>

                {data.categories.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-16">
                        {data.categories.map((cat) => (
                            <CategoryCard key={cat.slug} cat={cat} iconRender={getCategoryIcon} />
                        ))}
                    </div>
                ) : (
                    <div className="mb-16 p-20 text-center border-2 border-dashed rounded-3xl border-slate-200 text-slate-400 bg-white">
                        No categories found in the database.
                    </div>
                )}

                {/* --- POPULAR ARTICLES SECTION --- */}
                <section className="mt-8">
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="h-1 w-8 bg-indigo-600 rounded-full" />
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                            {searching ? "Search Results" : "Featured Intel"}
                        </h2>
                        {searching && (
                            <Badge variant="secondary" className="text-xs">
                                {filteredArticles.length} result(s)
                            </Badge>
                        )}
                    </div>

                    <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
                        <CardContent className="p-0 divide-y divide-slate-100">
                            {filteredArticles.length > 0 ? (
                                filteredArticles.map((art) => (
                                    <Link 
                                        key={art.id} 
                                        to={`/wiki/${art.category_slug}/${art.slug}`}
                                        className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex-1 pr-4">
                                            <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">
                                                {art.title}
                                                {searching && searchQuery && (
                                                    <span className="ml-2 text-xs text-indigo-500 font-mono bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        match
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                                                <span className="text-indigo-500 font-bold uppercase tracking-wider">{art.category_name}</span>
                                                <span className="h-1 w-1 bg-slate-300 rounded-full" />
                                                <span className="italic">{art.reading_time || 5} min read</span>
                                            </div>
                                            {searching && searchQuery && art.content && (
                                                <p className="text-sm text-slate-500 mt-2 line-clamp-1">
                                                    {art.content.substring(0, 150)}...
                                                </p>
                                            )}
                                        </div>
                                        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-16 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <BookOpen className="h-12 w-12 text-slate-300" />
                                        <p className="text-slate-500 font-medium">
                                            {searching ? "No articles match your search." : "No intelligence gathered yet."}
                                        </p>
                                        {searching && (
                                            <button
                                                onClick={clearSearch}
                                                className="text-indigo-500 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                Clear search <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>

            <Footer />
        </div>
    );
}

// --- SUB-KOMPONENTE ---

const CategoryCard = ({ cat, iconRender }) => (
    <Link to={`/wiki/${cat.slug}`} className="group">
        <Card className="h-full border-slate-200 hover:border-indigo-200 transition-all duration-300 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 bg-white">
            <CardHeader className="p-7">
                <div className="flex justify-between items-start mb-2">
                    {iconRender(cat)}
                    <span className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                        {cat.article_count || 0} Docs
                    </span>
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{cat.name}</CardTitle>
                <CardDescription className="text-slate-500 leading-snug mt-2 line-clamp-2 font-medium">
                    {cat.description}
                </CardDescription>
            </CardHeader>
        </Card>
    </Link>
);

const LoadingScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Syncing_Library_Data...</p>
    </div>
);