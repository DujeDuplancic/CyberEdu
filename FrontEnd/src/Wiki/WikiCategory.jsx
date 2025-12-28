import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Eye, BookOpen, AlertCircle } from 'lucide-react';

export default function WikiCategory() {
    const { category } = useParams();
    const [articles, setArticles] = useState([]);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategoryArticles();
    }, [category]);

    const fetchCategoryArticles = async () => {
        try {
            const response = await fetch(`http://localhost/CyberEdu/BackEnd/wiki/get_wiki_articles.php?category=${category}`);
            const data = await response.json();
            
            if (data.success) {
                setArticles(data.articles);
                
                if (data.articles.length > 0) {
                    setCategoryInfo({
                        name: data.articles[0].category_name,
                        slug: category
                    });
                } else {
                    // If no articles, try to get category info from categories API
                    const catResponse = await fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_categories.php');
                    const catData = await catResponse.json();
                    
                    if (catData.success) {
                        const foundCategory = catData.categories.find(cat => cat.slug === category);
                        if (foundCategory) {
                            setCategoryInfo({
                                name: foundCategory.name,
                                slug: category
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
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
                        <p>Loading...</p>
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
                        <Link to="/wiki" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Wiki Home
                        </Link>
                    </div>
                    
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">{categoryInfo?.name || category}</h1>
                        <p className="text-muted-foreground">{articles.length} articles</p>
                    </div>
                    
                    {articles.length > 0 ? (
                        <div className="grid gap-6">
                            {articles.map((article) => (
                                <Link key={article.id} to={`/wiki/${category}/${article.slug}`}>
                                    <Card className="hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                                        <CardHeader>
                                            <CardTitle className="text-xl flex justify-between items-start">
                                                <span>{article.title}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    article.difficulty_level === 'beginner' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : article.difficulty_level === 'intermediate'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {article.difficulty_level}
                                                </span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {article.excerpt && (
                                                <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                                            )}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {article.reading_time || 5} min read
                                                    </span>
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Eye className="h-3 w-3" />
                                                        {article.views || 0} views
                                                    </span>
                                                    {article.author_name && (
                                                        <span className="text-muted-foreground">
                                                            By {article.author_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-muted-foreground">
                                                    {new Date(article.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No articles yet</h3>
                                <p className="text-muted-foreground">Check back soon for new content!</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
}