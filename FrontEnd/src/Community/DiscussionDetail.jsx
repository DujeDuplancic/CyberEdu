import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Button } from "../Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar";
import { Badge } from "../Components/ui/badge";
import { Textarea } from "../Components/ui/textarea";
import { MessageSquare, Clock, Eye, ArrowLeft, Pin } from "lucide-react";
import { api } from '../lib/api';

export default function DiscussionDetail() {
  const { id } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDiscussion();
    fetchReplies();
  }, [id]);

  const fetchDiscussion = async () => {
    try {
      const response = await api.get(`/discussions/get_discussion_details.php?id=${id}`);
      if (response.success) {
        setDiscussion(response.discussion);
      }
    } catch (error) {
      console.error('Error fetching discussion:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await api.get(`/discussions/get_replies.php?discussion_id=${id}`);
      if (response.success) {
        setReplies(response.replies);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
  if (!replyContent.trim()) return;
  
  setSubmitting(true);
  try {
    // Dohvati korisnika iz localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const response = await api.post('/discussions/create_reply.php', {
      discussion_id: parseInt(id),
      content: replyContent,
      user_email: user.email, // Dodaj email
      user_id: user.id // Ili ID
    });
    
    if (response.success) {
      setReplies([...replies, response.reply]);
      setReplyContent('');
      // Update discussion last activity
      fetchDiscussion();
    }
  } catch (error) {
    console.error('Error posting reply:', error);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12">
          <div className="max-w-4xl mx-auto">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/community">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Discussions
              </Button>
            </Link>
          </div>

          {discussion && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {discussion.is_pinned && (
                        <Badge variant="secondary">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      <Badge variant="outline">{discussion.category}</Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2">{discussion.title}</CardTitle>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{discussion.author_name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{discussion.author_name}</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(discussion.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {discussion.views} views
                  </span>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="prose max-w-none mb-8">
                  <p className="whitespace-pre-wrap">{discussion.content}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Replies ({replies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {replies.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No replies yet. Be the first to reply!
                </p>
              ) : (
                <div className="space-y-6">
                  {replies.map((reply) => (
                    <div key={reply.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>{reply.author_name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium">{reply.author_name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Post a Reply</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitReply} disabled={submitting || !replyContent.trim()}>
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}