import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Textarea } from "../Components/ui/textarea";
import { Label } from "../Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { api } from '../lib/api';

const CATEGORIES = ['General', 'Reverse Engineering', 'Cryptography', 'Binary Exploitation', 'Web Security', 'Forensics', 'Steganography', 'Writeups', 'Questions', 'Tools'];

export default function CreateDiscussion() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return setError('You must be logged in to post.');

    setLoading(true);
    try {
      const res = await api.post('/discussions/create_discussion.php', {
        ...formData,
        user_id: user.id
      });

      if (res.success) {
        navigate(`/community/discussion/${res.discussion.id}`);
      } else {
        setError(res.message || 'Failed to save discussion.');
      }
    } catch (err) {
      setError('Server is unreachable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      
      <main className="flex-1 container max-w-3xl mx-auto py-10 px-4">
        {/* Back Navigation */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/community')} 
          className="mb-6 -ml-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to forum
        </Button>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="h-1.5 bg-primary/80" />
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">New Discussion</CardTitle>
            <p className="text-sm text-muted-foreground">Share your knowledge or ask a question.</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2 border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider opacity-60">Title</Label>
                <Input
                  id="title"
                  placeholder="What is your topic about?"
                  className="bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-primary h-11"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider opacity-60">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={v => setFormData({...formData, category: v})}
                >
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-none h-11">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider opacity-60">Message</Label>
                <Textarea
                  id="content"
                  placeholder="Provide details here..."
                  className="min-h-[250px] bg-slate-50 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-primary resize-none p-4"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={() => navigate('/community')} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="px-8 gap-2 shadow-lg shadow-primary/20">
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Post Discussion
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}