import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Edit, Trash2, Eye, Plus, RefreshCw, Save, X,
  FileText, BookOpen, Search, Layers, Clock, EyeOff
} from 'lucide-react';
import AdminPagination from './AdminPagination';

// Stranica veličina - usklađena s ostalim admin listama
const PAGE_SIZE = 8;

/**
 * Mapa boja za difficulty - soft tonovi koje koristi cijela aplikacija.
 */
const DIFFICULTY_COLORS = {
  beginner:     "bg-emerald-50 text-emerald-700 border-emerald-100",
  intermediate: "bg-amber-50 text-amber-700 border-amber-100",
  advanced:     "bg-rose-50 text-rose-700 border-rose-100"
};

export default function AdminWiki() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Pretraga + paginacija
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset paginacije pri promjeni filtera/podataka
  useEffect(() => { setCurrentPage(1); }, [search, articles.length]);

  // ===================================================================
  // FETCH funkcije - business logika je apsolutno netaknuta
  // ===================================================================
  const fetchArticles = async () => {
    try {
      setLoading(true);
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
      const userData = localStorage.getItem('user');
      if (!userData) { alert('You are not logged in!'); return; }
      const user = JSON.parse(userData);

      const response = await fetch('http://localhost/CyberEdu/BackEnd/admin/delete_wiki_article.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, user_id: user.id })
      });

      const data = await response.json();
      if (data.success) {
        setArticles(articles.filter(article => article.id !== id));
        alert('Article deleted successfully');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
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
      title: '', content: '', excerpt: '', category_id: '',
      reading_time: 5, difficulty_level: 'beginner', is_published: true
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = localStorage.getItem('user');
      if (!userData) { alert('You are not logged in!'); return; }
      const user = JSON.parse(userData);

      const url = editingArticle
        ? 'http://localhost/CyberEdu/BackEnd/admin/update_wiki_article.php'
        : 'http://localhost/CyberEdu/BackEnd/admin/create_wiki_article.php';

      const payload = editingArticle
        ? { ...formData, id: editingArticle.id }
        : { ...formData, user_id: user.id };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert(`Article ${editingArticle ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        fetchArticles();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert('Failed to save article: ' + error.message);
    }
  };

  // ===================================================================
  // Klijentsko filtriranje + paginacija
  // ===================================================================
  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) =>
      (a.title || "").toLowerCase().includes(q) ||
      (a.category_name || "").toLowerCase().includes(q) ||
      (a.difficulty_level || "").toLowerCase().includes(q)
    );
  }, [articles, search]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const visibleArticles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredArticles.slice(start, start + PAGE_SIZE);
  }, [filteredArticles, currentPage]);

  // Brojači za info chip
  const publishedCount = articles.filter((a) => a.is_published == 1).length;
  const draftCount     = articles.length - publishedCount;

  return (
    <div className="space-y-6">

      {/* Header sekcije */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="pt-5 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Wiki Articles Management</h2>
              <p className="text-sm text-slate-500">Create and manage knowledge base articles.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold">
              {publishedCount} published
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
              {draftCount} drafts
            </span>
            <Button variant="outline" onClick={fetchArticles} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={handleCreateClick}
              className="gap-2 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              New article
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pretraga */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by title, category or difficulty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-slate-200 h-11"
        />
      </div>

      {/* Lista članaka */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                Loading_Articles...
              </p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {search ? "No articles match your search" : "No articles yet"}
              </h3>
              <p className="text-slate-500 mt-1 mb-6">
                {search
                  ? "Try a different search term."
                  : "Create your first wiki article to populate the knowledge base."}
              </p>
              {!search && (
                <Button onClick={handleCreateClick} className="gap-2 shadow-md shadow-primary/20">
                  <Plus className="h-4 w-4" />
                  Create article
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleArticles.map((article) => {
                const diffClass =
                  DIFFICULTY_COLORS[article.difficulty_level] ||
                  "bg-slate-50 text-slate-700 border-slate-200";
                const isPublished = article.is_published == 1;

                return (
                  <li
                    key={article.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Lijevi blok: ikona + naslov + meta */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-slate-900 truncate">{article.title}</p>

                          {/* Difficulty chip */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${diffClass}`}>
                            {article.difficulty_level || "—"}
                          </span>

                          {/* Status chip */}
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <Eye className="h-3 w-3" />
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <EyeOff className="h-3 w-3" />
                              Draft
                            </span>
                          )}
                        </div>

                        {/* Meta red */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {article.category_name || "Uncategorized"}
                          </span>
                          {article.reading_time > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.reading_time} min read
                            </span>
                          )}
                          <span className="font-mono">
                            {article.views || 0} views
                          </span>
                          <span className="font-mono text-slate-400">
                            #{article.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Akcije */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1.5"
                      >
                        <a
                          href={`/wiki/${article.category_slug}/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View article"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(article)}
                        className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(article.id, article.title)}
                        className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Paginacija */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredArticles.length}
        pageSize={PAGE_SIZE}
      />

      {/* ==================================================================== */}
      {/* MODAL ZA CREATE / EDIT - redizajniran u istom vizualnom jeziku       */}
      {/* ==================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-slate-200 flex flex-col">

            {/* Header modala */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    {editingArticle ? 'Edit Article' : 'Create New Article'}
                  </h3>
                  <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-0.5">
                    {editingArticle ? `Editing ID #${editingArticle.id}` : 'Knowledge base entry'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sadržaj */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfe]">
              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_id" className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Category *
                    </Label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reading_time" className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Reading time (minutes)
                    </Label>
                    <Input
                      id="reading_time"
                      name="reading_time"
                      type="number"
                      min="1"
                      value={formData.reading_time}
                      onChange={handleInputChange}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level" className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Difficulty level
                    </Label>
                    <select
                      id="difficulty_level"
                      name="difficulty_level"
                      value={formData.difficulty_level}
                      onChange={handleInputChange}
                      className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Excerpt
                  </Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Short summary shown on the article card."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={10}
                    placeholder="HTML markup is supported."
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-slate-400">
                    You can use HTML tags for formatting.
                  </p>
                </div>

                {/* Toggle Published */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="h-4 w-4 accent-primary"
                  />
                  <Label htmlFor="is_published" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Publish article (visible to users)
                  </Label>
                </div>

                {/* Akcije */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2 shadow-md shadow-primary/20">
                    <Save className="h-4 w-4" />
                    {editingArticle ? 'Update article' : 'Create article'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
