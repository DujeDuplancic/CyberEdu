"use client"

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Eye, User, Calendar, AlertTriangle, BookOpen, Loader2 } from 'lucide-react';

export default function WikiArticle() {
    const { category, articleSlug } = useParams();
    const navigate = useNavigate();
    const [state, setState] = useState({ article: null, loading: true, error: null });

    // --- LOGIKA DOHVAĆANJA PODATAKA ---
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await fetch(`http://localhost/CyberEdu/BackEnd/wiki/get_wiki_article.php?slug=${articleSlug}`);
                const data = await res.json();
                
                if (data.success) setState({ article: data.article, loading: false, error: null });
                else setState({ article: null, loading: false, error: data.message || 'Article not found' });
            } catch (err) {
                setState({ article: null, loading: false, error: 'Failed to connect to intelligence server' });
            }
        };
        fetchArticle();
    }, [articleSlug]);

    const { article, loading, error } = state;

    // --- POMOĆNE KOMPONENTE (UI STATE) ---
    if (loading) return <LoadingState />;
    if (error || !article) return <ErrorState error={error} navigate={navigate} />;

    return (
        <div className="min-h-screen flex flex-col bg-[#fbfcfd]">
            <Header />
            
            <main className="flex-1 container py-12 max-w-4xl mx-auto px-4">
                {/* Breadcrumbs - Suptilna navigacija */}
                <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
                    <Link to="/wiki" className="hover:text-indigo-600 transition-colors">Wiki</Link>
                    <span className="text-slate-300">/</span>
                    <Link to={`/wiki/${category}`} className="hover:text-indigo-600 transition-colors uppercase tracking-wider text-[11px]">
                        {article.category_name}
                    </Link>
                </nav>

                <article>
                    <header className="mb-10">
                        <DifficultyBadge level={article.difficulty_level} />
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6 mt-4">
                            {article.title}
                        </h1>
                        
                        {/* Meta Informacije - "Card-style" layout */}
                        <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-slate-500 border-y border-slate-100 py-6">
                            <MetaItem icon={User} text={article.author_name || 'System Admin'} />
                            <MetaItem icon={Calendar} text={new Date(article.created_at).toLocaleDateString('hr-HR')} />
                            <MetaItem icon={Clock} text={`${article.reading_time || 5} min read`} />
                            <MetaItem icon={Eye} text={`${article.views || 0} views`} />
                        </div>
                    </header>
                    
                    {/* Sadržaj Članka - Optimizirana tipografija */}
                    <div className="prose prose-slate prose-indigo max-w-none 
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:leading-relaxed prose-p:text-slate-600
                        prose-pre:bg-slate-900 prose-pre:rounded-2xl shadow-sm">
                        
                        {article.content ? (
                            <div dangerouslySetInnerHTML={{ __html: article.content }} className="article-body" />
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-medium">Technical documentation is being drafted...</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Navigacija */}
                    <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl px-6 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-all">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Intelligence Base
                        </Button>
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            ID: {articleSlug?.toUpperCase()}
                        </p>
                    </footer>
                </article>
            </main>
            <Footer />
        </div>
    );
}

// --- SUB-KOMPONENTE ZA ČISTIJI KOD ---

const MetaItem = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-2 group cursor-default">
        <Icon className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">{text}</span>
    </div>
);

const DifficultyBadge = ({ level }) => {
    const styles = {
        beginner: "bg-emerald-50 text-emerald-700 border-emerald-100",
        intermediate: "bg-amber-50 text-amber-700 border-amber-100",
        advanced: "bg-rose-50 text-rose-700 border-rose-100"
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[level] || styles.beginner}`}>
            {level}
        </span>
    );
};

const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-500 font-medium tracking-tight">Decrypting Content...</p>
        </div>
    </div>
);

const ErrorState = ({ error, navigate }) => (
    <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-xl rounded-[2rem] overflow-hidden">
                <CardContent className="pt-10 pb-10 text-center">
                    <div className="bg-rose-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="h-10 w-10 text-rose-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h3>
                    <p className="text-slate-500 mb-8">{error || 'The requested intel does not exist.'}</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">Go Back</Button>
                        <Link to="/wiki"><Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8">Return Home</Button></Link>
                    </div>
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
);