import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Eye, Plus, RefreshCw, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminWiki() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    
    // State za modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        excerpt: '',
        category_id: '',
        reading_time: 5,
        difficulty_level: 'beginner',
        is_published: true
    });

    useEffect(() => {
        fetchArticles();
        fetchCategories();
    }, []);

    const fetchArticles = async () => {
        try {
            const response = await fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_articles.php?limit=100');
            const data = await response.json();
            if (data.success) setArticles(data.articles);
        } catch (error) {
            console.error('Error fetching articles:', error);
            alert('Error loading articles: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost/CyberEdu/BackEnd/wiki/get_wiki_categories.php');
            const data = await response.json();
            if (data.success) setCategories(data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async (id, title) => {
        if (!confirm(`Are you sure you want to delete article "${title}"? This action cannot be undone!`)) return;
        
        try {
            // Dobavi user_id iz localStorage
            const userData = localStorage.getItem('user');
            if (!userData) {
                alert('❌ You are not logged in!');
                return;
            }
            
            const user = JSON.parse(userData);
            
            const response = await fetch('http://localhost/CyberEdu/BackEnd/admin/delete_wiki_article.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: id,
                    user_id: user.id  // DODANO: Šaljemo user_id
                })
            });
            
            const data = await response.json();
            if (data.success) {
                setArticles(articles.filter(article => article.id !== id));
                alert('✅ Article deleted successfully!');
            } else {
                alert('❌ Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('❌ Failed to delete article');
        }
    };

    const handleEditClick = (article) => {
        setEditingArticle(article);
        setFormData({
            title: article.title,
            content: article.content,
            excerpt: article.excerpt || '',
            category_id: article.category_id || '',
            reading_time: article.reading_time || 5,
            difficulty_level: article.difficulty_level || 'beginner',
            is_published: article.is_published == 1
        });
        setIsModalOpen(true);
    };

    const handleCreateClick = () => {
        setEditingArticle(null);
        setFormData({
            title: '',
            content: '',
            excerpt: '',
            category_id: '',
            reading_time: 5,
            difficulty_level: 'beginner',
            is_published: true
        });
        setIsModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // Dobavi user_id za create/update
            const userData = localStorage.getItem('user');
            if (!userData) {
                alert('❌ You are not logged in!');
                return;
            }
            
            const user = JSON.parse(userData);
            
            const url = editingArticle 
                ? 'http://localhost/CyberEdu/BackEnd/admin/update_wiki_article.php'
                : 'http://localhost/CyberEdu/BackEnd/admin/create_wiki_article.php';
            
            // Dodaj user_id u payload za create
            const payload = editingArticle 
                ? { ...formData, id: editingArticle.id }
                : { ...formData, user_id: user.id };
            
            console.log('Sending payload:', payload);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            console.log('Response:', data);
            
            if (data.success) {
                alert(`✅ Article ${editingArticle ? 'updated' : 'created'} successfully!`);
                setIsModalOpen(false);
                fetchArticles(); // Refresh the list
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error saving article:', error);
            alert('❌ Failed to save article: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Wiki Articles Management</h2>
                <div className="flex gap-2">
                    <Button onClick={fetchArticles} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    
                    <Button onClick={handleCreateClick}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Article
                    </Button>
                </div>
            </div>

            {/* Modal za edit/create */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-semibold">
                                    {editingArticle ? 'Edit Article' : 'Create New Article'}
                                </h3>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="category_id">Category *</Label>
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            required
                                        >
                                            <option value="">Select category</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="reading_time">Reading Time (minutes)</Label>
                                        <Input
                                            id="reading_time"
                                            name="reading_time"
                                            type="number"
                                            min="1"
                                            value={formData.reading_time}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="difficulty_level">Difficulty Level</Label>
                                        <select
                                            id="difficulty_level"
                                            name="difficulty_level"
                                            value={formData.difficulty_level}
                                            onChange={handleInputChange}
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="excerpt">Excerpt</Label>
                                    <textarea
                                        id="excerpt"
                                        name="excerpt"
                                        value={formData.excerpt}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="content">Content *</Label>
                                    <textarea
                                        id="content"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        rows={10}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        You can use HTML tags for formatting
                                    </p>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="is_published"
                                        name="is_published"
                                        checked={formData.is_published}
                                        onChange={handleInputChange}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor="is_published">Published</Label>
                                </div>
                                
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        <Save className="h-4 w-4 mr-2" />
                                        {editingArticle ? 'Update Article' : 'Create Article'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>All Articles ({articles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2">Loading articles...</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No articles found. Create your first one!
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Views</TableHead>
                                    <TableHead>Difficulty</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {articles.map((article) => (
                                    <TableRow key={article.id}>
                                        <TableCell className="font-mono">{article.id}</TableCell>
                                        <TableCell className="font-medium">
                                            <div className="max-w-xs truncate" title={article.title}>
                                                {article.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>{article.category_name}</TableCell>
                                        <TableCell>{article.views}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                article.difficulty_level === 'beginner' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : article.difficulty_level === 'intermediate'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {article.difficulty_level}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                article.is_published == 1
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {article.is_published == 1 ? 'Published' : 'Draft'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    asChild
                                                >
                                                    <a 
                                                        href={`/wiki/${article.category_slug}/${article.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View article"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                    </a>
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => handleEditClick(article)}
                                                    title="Edit article"
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => handleDelete(article.id, article.title)}
                                                    title="Delete article"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}