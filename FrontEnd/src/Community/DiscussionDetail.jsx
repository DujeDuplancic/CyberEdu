import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar";
import { Badge } from "../Components/ui/badge";
import { Textarea } from "../Components/ui/textarea";
import { MessageSquare, Clock, Eye, ArrowLeft, Pin, Send } from "lucide-react";
import { api } from '../lib/api';

export default function DiscussionDetail() {
  const { id } = useParams();
  const [state, setState] = useState({ discussion: null, replies: [], loading: true });
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Unified fetcher for data
  const loadData = async () => {
    try {
      const [discRes, replRes] = await Promise.all([
        api.get(`/discussions/get_discussion_details.php?id=${id}`),
        api.get(`/discussions/get_replies.php?discussion_id=${id}`)
      ]);
      setState({
        discussion: discRes.success ? discRes.discussion : null,
        replies: replRes.success ? replRes.replies : [],
        loading: false
      });
    } catch (e) { console.error(e); setState(s => ({ ...s, loading: false })); }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const res = await api.post('/discussions/create_reply.php', {
      discussion_id: parseInt(id),
      content: replyContent,
      user_id: user.id
    });

    if (res.success) {
      setReplyContent('');
      loadData(); // Refresh both views and replies
    }
    setSubmitting(false);
  };

  if (state.loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      
      <main className="flex-1 container max-w-4xl mx-auto py-10 px-4">
        <Link to="/community" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to feed
        </Link>

        {state.discussion && (
          <div className="space-y-8">
            {/* Main Discussion Thread */}
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="h-1 bg-primary/60" />
              <CardHeader className="pb-4">
                <div className="flex gap-2 mb-3">
                  {state.discussion.is_pinned && <Badge className="bg-amber-500/10 text-amber-600 border-none"><Pin className="h-3 w-3 mr-1" /> Pinned</Badge>}
                  <Badge variant="outline" className="uppercase text-[10px] tracking-widest">{state.discussion.category}</Badge>
                </div>
                <CardTitle className="text-3xl font-extrabold">{state.discussion.title}</CardTitle>
                
                <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground border-t mt-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border"><AvatarFallback>{state.discussion.author_name?.[0]}</AvatarFallback></Avatar>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{state.discussion.author_name}</span>
                  </div>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(state.discussion.created_at).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {state.discussion.views} views</span>
                </div>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none pb-8 text-slate-700 dark:text-slate-300">
                <p className="whitespace-pre-wrap leading-relaxed">{state.discussion.content}</p>
              </CardContent>
            </Card>

            {/* Replies Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 px-1">
                <MessageSquare className="h-5 w-5 text-primary" /> 
                Responses <span className="text-muted-foreground font-normal">({state.replies.length})</span>
              </h3>
              
              <div className="grid gap-4">
                {state.replies.map((reply) => (
                  <Card key={reply.id} className="border-none shadow-sm bg-white/50 dark:bg-slate-900/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-8 w-8"><AvatarFallback>{reply.author_name?.[0]}</AvatarFallback></Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{reply.author_name}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap pl-11">{reply.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Reply Editor */}
            <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent">
              <CardContent className="p-6">
                <Textarea
                  placeholder="Share your thoughts or solutions..."
                  className="min-h-[120px] bg-white dark:bg-slate-900 border-none resize-none focus-visible:ring-1 focus-visible:ring-primary mb-4"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button onClick={handleReply} disabled={submitting || !replyContent.trim()} className="px-6 gap-2">
                    {submitting ? 'Sending...' : <><Send className="h-4 w-4" /> Post Reply</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}