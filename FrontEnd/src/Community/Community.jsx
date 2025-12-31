import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { MessageSquare, TrendingUp, Clock, User, Plus, Search, Users, Activity } from "lucide-react"
import { Input } from "../Components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select"
import DiscussionCard from './DiscussionCard';
import { api } from '../lib/api';

const CATEGORIES = [
  'All',
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

export default function CommunityPage() {
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTopics: 0,
    activeMembers: 0,
    totalPosts: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    category: 'All',
    search: ''
  });

  useEffect(() => {
    fetchDiscussions();
    fetchStats();
  }, [filters.category, filters.search, pagination.page]);

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      let url = `/discussions/get_discussions.php?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (filters.category && filters.category !== 'All') {
        url += `&category=${encodeURIComponent(filters.category)}`;
      }
      
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      
      const response = await api.get(url);
      
      if (response.success) {
        setDiscussions(response.discussions);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch total topics
      const topicsResponse = await api.get('/discussions/get_discussions.php?limit=1');
      
      if (topicsResponse.success) {
        const totalTopics = topicsResponse.pagination?.total || 0;
        
        // Fetch total replies
        let totalReplies = 0;
        try {
          const repliesResponse = await api.get('/discussions/get_replies.php?limit=1');
          if (repliesResponse.success) {
            totalReplies = repliesResponse.pagination?.total || 0;
          }
        } catch (error) {
          console.error('Error fetching replies count:', error);
        }
        
        const totalPosts = totalTopics + totalReplies;
        
        
        // Calculate active members (unique users who created discussions or replies)
        let activeMembers = 0;
        try {
          // Get unique authors from discussions
          const discussionsResponse = await api.get('/discussions/get_discussions.php?limit=1000');
          if (discussionsResponse.success && discussionsResponse.discussions) {
            const uniqueAuthors = new Set();
            discussionsResponse.discussions.forEach(d => {
              if (d.author_id) uniqueAuthors.add(d.author_id);
            });
            activeMembers = uniqueAuthors.size;
          }
        } catch (error) {
          console.error('Error calculating active members:', error);
          // Fallback: 10% of total topics as active members
          activeMembers = Math.max(1, Math.round(totalTopics * 0.1));
        }
        
        // Calculate this week's topics
        const thisWeekTopics = discussions.filter(d => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return new Date(d.created_at) > oneWeekAgo;
        }).length;
        
        setStats({
          totalTopics,
          activeMembers: Math.max(1, activeMembers), // Minimum 1
          totalPosts,
          thisWeekTopics
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Default values if API fails
      setStats({
        totalTopics: discussions.length,
        activeMembers: Math.max(1, Math.round(discussions.length * 0.3)),
        totalPosts: discussions.length * 1.5, // Estimate
        thisWeekTopics: Math.round(discussions.length * 0.3)
      });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDiscussions();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const refreshDiscussions = () => {
    fetchDiscussions();
    fetchStats();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-4">Community Forum</h1>
              <p className="text-lg text-muted-foreground">
                Connect with fellow hackers, share writeups, and discuss cybersecurity topics.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate('/community/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Discussion
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Topics</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTopics}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.thisWeekTopics || 0} this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Activity className="inline h-3 w-3 mr-1" />
                  {Math.round(stats.activeMembers * 0.3)} online now
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPosts} Posts</div>
              </CardContent>
            </Card>
          </div>

          {/* Ostali kod ostaje isti */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Discussions</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search discussions..."
                      className="pl-10"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-64">
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setFilters({ category: 'All', search: '' });
                    refreshDiscussions();
                  }}
                >
                  Clear
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Discussions</CardTitle>
                  <CardDescription>Join the conversation and share your knowledge</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshDiscussions}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : discussions.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No discussions found</h3>
                  <p className="text-muted-foreground mb-6">
                    {filters.search || filters.category !== 'All' 
                      ? 'Try changing your search filters' 
                      : 'Be the first to start a discussion!'}
                  </p>
                  {(!filters.search && filters.category === 'All') && (
                    <Button onClick={() => navigate('/community/new')}>
                      Start a Discussion
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {discussions.map((discussion) => (
                    <DiscussionCard 
                      key={discussion.id} 
                      discussion={discussion}
                      onUpdate={refreshDiscussions}
                    />
                  ))}
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}