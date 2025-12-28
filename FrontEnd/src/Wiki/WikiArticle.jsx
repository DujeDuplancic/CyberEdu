import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Eye, User, Calendar, AlertTriangle, BookOpen } from 'lucide-react';

export default function WikiArticle() {
    const { category, articleSlug } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchArticle();
    }, [articleSlug]);

    const fetchArticle = async () => {
        try {
            const response = await fetch(`http://localhost/CyberEdu/BackEnd/wiki/get_wiki_article.php?slug=${articleSlug}`);
            const data = await response.json();
            
            if (data.success) {
                setArticle(data.article);
            } else {
                setError(data.message || 'Article not found');
            }
        } catch (error) {
            console.error('Error fetching article:', error);
            setError('Failed to load article');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container py-8">
                    <div className="max-w-6xl mx-auto text-center">
                        <p>Loading article...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6">
                            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </Button>
                        </div>
                        <Card>
                            <CardContent className="py-12 text-center">
                                <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Article Not Found</h3>
                                <p className="text-muted-foreground mb-4">{error || 'The article you are looking for does not exist.'}</p>
                                <Link to="/wiki">
                                    <Button>Return to Wiki</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            
            <main className="flex-1 container py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Link to="/wiki" className="hover:text-primary transition-colors">
                                Wiki
                            </Link>
                            <span>/</span>
                            <Link to={`/wiki/${category}`} className="hover:text-primary transition-colors">
                                {article.category_name}
                            </Link>
                            <span>/</span>
                            <span className="text-foreground">{article.title}</span>
                        </div>
                    </div>
                    
                    <article>
                        <header className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    article.difficulty_level === 'beginner' 
                                        ? 'bg-green-100 text-green-800' 
                                        : article.difficulty_level === 'intermediate'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {article.difficulty_level}
                                </span>
                            </div>
                            
                            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
                            
                            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{article.author_name || 'Unknown Author'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>{article.reading_time || 5} min read</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    <span>{article.views || 0} views</span>
                                </div>
                            </div>
                        </header>
                        
                        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                            {article.content ? (
                                <div dangerouslySetInnerHTML={{ __html: article.content }} />
                            ) : (
                                <Card>
                                    <CardContent className="py-8 text-center">
                                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">Content coming soon...</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        
                        <footer className="mt-12 pt-8 border-t">
                            <div className="flex justify-between items-center">
                                <Link to={`/wiki/${category}`}>
                                    <Button variant="outline" className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to {article.category_name}
                                    </Button>
                                </Link>
                                <div className="text-sm text-muted-foreground">
                                    Last updated: {new Date(article.updated_at || article.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </footer>
                    </article>
                </div>
            </main>
            
            <Footer />
        </div>
    );
}