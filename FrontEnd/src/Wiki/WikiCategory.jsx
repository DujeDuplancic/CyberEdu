"use client"

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/Components/Header';
import { Footer } from '@/Components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ArrowLeft, Clock, Eye, BookOpen, Loader2, ChevronRight } from 'lucide-react';

export default function WikiCategory() {
    const { category } = useParams();
    const [data, setData] = useState({ articles: [], categoryInfo: null, loading: true });

    /**
     * Glavna funkcija za dohvaćanje podataka.
     * Prvo pokušava dohvatiti članke, a ako ih nema, traži informacije o kategoriji.
     */
    const fetchContent = async () => {
        try {
            const res = await fetch(`http://localhost/CyberEdu/BackEnd/wiki/get_wiki_articles.php?category=${category}`);
            const result = await res.json();
            
            let info = null;
            if (result.success && result.articles.length > 0) {
                info = { name: result.articles[0].category_name, slug: category };
            } else {
                // Fallback: Ako je kategorija prazna, dohvati ime iz popisa kategorija
                const catRes = await fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_categories.php');
                const catData = await catRes.json();
                const found = catData.categories?.find(c => c.slug === category);
                if (found) info = { name: found.name, slug: category };
            }

            setData({ articles: result.articles || [], categoryInfo: info, loading: false });
        } catch (error) {
            console.error('Fetch error:', error);
            setData(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => { fetchContent(); }, [category]);

    if (data.loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
            <Header />
            
            <main className="flex-1 container py-12 max-w-5xl mx-auto px-4">
                {/* Povratna navigacija */}
                <div className="mb-8">
                    <Link to="/wiki" className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors w-fit">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold tracking-wide uppercase">Back to Library</span>
                    </Link>
                </div>
                
                {/* Header sekcija */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                            {data.categoryInfo?.name || category}
                        </h1>
                        <p className="text-slate-500 flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                            Knowledge archive contains {data.articles.length} modules
                        </p>
                    </div>
                </div>

                {/* Grid s člancima */}
                {data.articles.length > 0 ? (
                    <div className="grid gap-4">
                        {data.articles.map((article) => (
                            <ArticleCard key={article.id} article={article} category={category} />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </main>
            
            <Footer />
        </div>
    );
}

// --- POMOĆNE KOMPONENTE ---

const ArticleCard = ({ article, category }) => (
    <Link to={`/wiki/${category}/${article.slug}`} className="group">
        <Card className="border-slate-200 hover:border-indigo-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {article.title}
                    </CardTitle>
                    <DifficultyBadge level={article.difficulty_level} />
                </div>
            </CardHeader>
            <CardContent>
                {article.excerpt && <p className="text-slate-500 text-sm leading-relaxed mb-5 line-clamp-2">{article.excerpt}</p>}
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-5 text-xs font-medium text-slate-400">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-indigo-400" /> {article.reading_time || 5} min</span>
                        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-indigo-400" /> {article.views || 0}</span>
                        {article.author_name && <span className="hidden sm:inline italic">by {article.author_name}</span>}
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
            </CardContent>
        </Card>
    </Link>
);

const DifficultyBadge = ({ level }) => {
    const colors = {
        beginner: "bg-emerald-50 text-emerald-700 border-emerald-100",
        intermediate: "bg-amber-50 text-amber-700 border-amber-100",
        advanced: "bg-rose-50 text-rose-700 border-rose-100"
    };
    return (
        <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md border ${colors[level] || colors.beginner}`}>
            {level}
        </span>
    );
};

const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-slate-500 text-sm font-medium animate-pulse">Accessing Archive...</p>
        </div>
    </div>
);

const EmptyState = () => (
    <Card className="border-dashed border-2 border-slate-200 bg-transparent shadow-none">
        <CardContent className="py-20 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">Database Empty</h3>
            <p className="text-slate-500 max-w-xs mx-auto">This knowledge sector is currently being populated by our agents.</p>
        </CardContent>
    </Card>
);