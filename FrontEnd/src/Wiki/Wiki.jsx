import { Link } from "react-router-dom"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Lock, Code, Key, ImageIcon, Globe, Search, BookOpen } from "lucide-react"
import { useEffect, useState } from "react"

export default function WikiPage() {
    const [categories, setCategories] = useState([]);
    const [popularArticles, setPopularArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchWikiData();
    }, []);

    const fetchWikiData = async () => {
        try {
            setLoading(true);
            
            // 1. FETCH CATEGORIES FROM API
            const categoriesRes = await fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_categories.php');
            
            // Provjeri da li je response OK
            if (!categoriesRes.ok) {
                throw new Error(`HTTP error! status: ${categoriesRes.status}`);
            }
            
            const categoriesData = await categoriesRes.json();
            
            if (categoriesData.success) {
                setCategories(categoriesData.categories);
                console.log("✅ Fetched categories:", categoriesData.categories);
            } else {
                console.error("❌ Failed to fetch categories:", categoriesData.message);
                // Fallback na mock podatke ako API ne radi
                setCategories(getMockCategories());
            }

            // 2. FETCH POPULAR ARTICLES
            const articlesRes = await fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_articles.php?limit=5');
            
            if (!articlesRes.ok) {
                throw new Error(`HTTP error! status: ${articlesRes.status}`);
            }
            
            const articlesData = await articlesRes.json();
            
            if (articlesData.success) {
                setPopularArticles(articlesData.articles);
                console.log("✅ Fetched popular articles:", articlesData.articles);
            } else {
                console.error("❌ Failed to fetch articles:", articlesData.message);
                // Fallback na mock podatke
                setPopularArticles(getMockPopularArticles());
            }
        } catch (error) {
            console.error('❌ Error fetching wiki data:', error);
            // Ako API ne radi, koristi mock podatke
            setCategories(getMockCategories());
            setPopularArticles(getMockPopularArticles());
        } finally {
            setLoading(false);
        }
    };

    // Fallback mock podaci ako API ne radi
    const getMockCategories = () => {
        return [
            {
                id: 1,
                name: "Reverse Engineering",
                slug: "reverse-engineering",
                icon: "Code",
                description: "Learn disassembly, debugging, and binary analysis techniques.",
                article_count: 0
            },
            {
                id: 2,
                name: "Binary Exploitation",
                slug: "binary-exploitation",
                icon: "Lock",
                description: "Master buffer overflows, ROP chains, and memory corruption.",
                article_count: 0
            },
            {
                id: 3,
                name: "Cryptography",
                slug: "cryptography",
                icon: "Key",
                description: "Understand encryption algorithms, hashing, and cryptanalysis.",
                article_count: 0
            },
            {
                id: 4,
                name: "Steganography",
                slug: "steganography",
                icon: "Image",
                description: "Discover hidden messages in digital media and files.",
                article_count: 0
            },
            {
                id: 5,
                name: "Web Security",
                slug: "web-security",
                icon: "Globe",
                description: "Explore web vulnerabilities and exploitation techniques.",
                article_count: 0
            }
        ];
    };

    const getMockPopularArticles = () => {
        return [
            { 
                id: 1, 
                title: "Getting Started with Reverse Engineering", 
                category_name: "Reverse Engineering",
                category_slug: "reverse-engineering",
                slug: "getting-started",
                views: 1234,
                reading_time: 10,
                excerpt: "Learn the basics of reverse engineering"
            }
        ];
    };

    // Map icons based on category name or icon from database
    const getIcon = (category) => {
        // Prvo probaj koristiti icon iz baze
        const iconMap = {
            'Code': Code,
            'Lock': Lock,
            'Key': Key,
            'Image': ImageIcon,
            'ImageIcon': ImageIcon,
            'Globe': Globe
        };
        
        if (category.icon && iconMap[category.icon]) {
            return iconMap[category.icon];
        }
        
        // Fallback na category name mapping
        const categoryIconMap = {
            'Reverse Engineering': Code,
            'Binary Exploitation': Lock,
            'Cryptography': Key,
            'Steganography': ImageIcon,
            'Web Security': Globe
        };
        
        return categoryIconMap[category.name] || BookOpen;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container py-12">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-lg">Loading Wiki Knowledge Base...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 container py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-4">Knowledge Base</h1>
                        <p className="text-lg text-muted-foreground mb-6">
                            Comprehensive guides, tutorials, and documentation for learning cybersecurity concepts.
                        </p>

                        <div className="relative max-w-2xl">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search articles..." 
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                        {categories.length > 0 ? (
                            categories.map((category) => {
                                const IconComponent = getIcon(category);
                                return (
                                    <Link key={category.slug} to={`/wiki/${category.slug}`}>
                                        <Card className="h-full hover:border-primary/50 transition-all duration-300 group hover:shadow-md">
                                            <CardHeader>
                                                <IconComponent className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                                                <CardTitle className="flex items-center justify-between">
                                                    {category.name}
                                                    <span className="text-sm font-normal text-muted-foreground">
                                                        {category.article_count || 0} articles
                                                    </span>
                                                </CardTitle>
                                                <CardDescription className="leading-relaxed">
                                                    {category.description}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="col-span-3 text-center py-8">
                                <p className="text-muted-foreground">No categories found. Please check your API connection.</p>
                            </div>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5" />
                                Popular Articles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {popularArticles.length > 0 ? (
                                <div className="space-y-4">
                                    {popularArticles.map((article) => (
                                        <Link
                                            key={article.id}
                                            to={`/wiki/${article.category_slug}/${article.slug}`}
                                            className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group hover:shadow-sm"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold group-hover:text-primary transition-colors">
                                                    {article.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {article.category_name}
                                                </p>
                                                {article.excerpt && (
                                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                        {article.excerpt}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right ml-4">
                                                <span className="text-sm text-muted-foreground block">
                                                    {article.views || 0} views
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {article.reading_time || 5} min read
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground">No articles found yet. Be the first to write one!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}