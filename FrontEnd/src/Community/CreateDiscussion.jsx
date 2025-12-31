import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../Components/ui/card";
import { Input } from "../Components/ui/input";
import { Textarea } from "../Components/ui/textarea";
import { Label } from "../Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { ArrowLeft } from "lucide-react";
import { api } from '../lib/api';

const CATEGORIES = [
  'General',
  'Reverse Engineering',
  'Cryptography',
  'Binary Exploitation',
  'Web Security',
  'Forensics',
  'Steganography',
  'Writeups',
  'Questions',
  'Tools'
];

export default function CreateDiscussion() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!title.trim() || !content.trim()) {
    setError('Title and content are required');
    return;
  }

  setSubmitting(true);
  setError('');

  try {
    // Dohvati korisnika iz localStorage (tamo ga spašavaš nakon logina)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const response = await api.post('/discussions/create_discussion.php', {
      title: title.trim(),
      content: content.trim(),
      category,
      user_email: user.email, // Šalji email iz localStorage
      user_id: user.id // Ili šalji ID
    });

    if (response.success) {
      navigate(`/community/discussion/${response.discussion.id}`);
    } else {
      setError(response.message || 'Failed to create discussion');
    }
  } catch (error) {
    console.error('Error creating discussion:', error);
    setError('An error occurred while creating the discussion');
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/community')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Discussions
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create New Discussion</CardTitle>
              <CardDescription>
                Start a new conversation with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What would you like to discuss?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Type your message here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Be respectful and follow community guidelines
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/community')}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Discussion'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}