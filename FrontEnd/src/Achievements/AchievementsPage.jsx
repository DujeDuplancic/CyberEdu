import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "../Components/Header";
import { Footer } from "../Components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card";
import { Badge } from "../Components/ui/badge";
import { Button } from "../Components/ui/button";
import { Trophy, Lock, Unlock, TrendingUp, Award, Star, Calendar, Filter } from "lucide-react";
import { api } from '../lib/api';
import { useNotifications } from '../contexts/NotificationContext'; // DODAJ OVO

export default function AchievementsPage() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userId, setUserId] = useState(null);
  const { showAchievement, showSuccess, showError } = useNotifications(); // DODAJ OVO

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
      fetchAchievements(user.id);
      fetchUserAchievements(user.id);
      fetchStats(user.id);
    } else {
      navigate('/login');
    }
  }, []);

  const fetchAchievements = async (userId) => {
    try {
      const response = await api.get(`/achievements/get_achievements.php?user_id=${userId}`);
      if (response.success) {
        setAchievements(response.achievements);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      showError('Failed to load achievements');
    }
  };

  const fetchUserAchievements = async (userId) => {
    try {
      const response = await api.get(`/achievements/get_achievements.php?action=user&user_id=${userId}`);
      if (response.success) {
        setUserAchievements(response.achievements);
      }
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  };

  const fetchStats = async (userId) => {
    try {
      const response = await api.get(`/achievements/get_user_stats.php?user_id=${userId}`);
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNewAchievements = async () => {
    if (!userId) return;
    
    try {
      const response = await api.get(`/achievements/get_achievements.php?action=check&user_id=${userId}`);
      
      if (response.success && response.new_achievements && response.new_achievements.length > 0) {
        // Prikaži notifikaciju za svaki novi achievement
        response.new_achievements.forEach(achievement => {
          showAchievement({
            name: achievement.name,
            description: achievement.description,
            points_reward: achievement.points_reward || 0
          });
        });
        
        // Refresh data
        fetchAchievements(userId);
        fetchUserAchievements(userId);
        fetchStats(userId);
      } else {
        showSuccess('No new achievements unlocked. Keep trying!', 'Achievement Check');
      }
    } catch (error) {
      showError('Error checking new achievements');
      console.error('Error checking new achievements:', error);
    }
  };

  const getFilteredAchievements = () => {
    switch (activeTab) {
      case 'unlocked':
        return achievements.filter(a => a.unlocked);
      case 'locked':
        return achievements.filter(a => !a.unlocked);
      default:
        return achievements;
    }
  };

  const getAchievementIcon = (achievement) => {
    if (achievement.unlocked) {
      return <Unlock className="h-6 w-6 text-green-500" />;
    }
    return <Lock className="h-6 w-6 text-gray-400" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Reverse Engineering': 'bg-blue-500',
      'Binary Exploitation': 'bg-red-500',
      'Cryptography': 'bg-purple-500',
      'Web Security': 'bg-green-500',
      'Forensics': 'bg-yellow-500',
      'Steganography': 'bg-pink-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading achievements...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
              <Trophy className="h-10 w-10 text-yellow-500" />
              Achievements
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete challenges and unlock achievements to earn bonus points and showcase your skills.
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.unlocked} / {stats.total}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{stats.percentage}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recent Unlocks</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.recent_unlocks.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.category_stats.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Different categories</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Actions</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={checkNewAchievements}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Check New Achievements
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Category Stats */}
          {stats && stats.category_stats.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Category Progress</CardTitle>
                <CardDescription>Your achievement progress by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.category_stats.map((category) => (
                    <div key={category.category_name}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getCategoryColor(category.category_name)}`} />
                          {category.category_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {category.unlocked_in_category} / {category.total_in_category}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ 
                            width: `${(category.unlocked_in_category / category.total_in_category) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter achievements:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTab === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                All Achievements
              </Button>
              <Button
                variant={activeTab === 'unlocked' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab('unlocked')}
                className="flex items-center gap-1"
              >
                <Unlock className="h-3 w-3" />
                Unlocked ({achievements.filter(a => a.unlocked).length})
              </Button>
              <Button
                variant={activeTab === 'locked' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab('locked')}
                className="flex items-center gap-1"
              >
                <Lock className="h-3 w-3" />
                Locked ({achievements.filter(a => !a.unlocked).length})
              </Button>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAchievements().map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`transition-all hover:shadow-lg ${
                  achievement.unlocked 
                    ? 'border-green-500/20 bg-green-50/50' 
                    : 'border-border'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        achievement.unlocked 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {getAchievementIcon(achievement)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                        {achievement.category_name && (
                          <Badge 
                            variant="outline" 
                            className="mt-1 text-xs"
                            style={{ 
                              backgroundColor: `${getCategoryColor(achievement.category_name)}20`,
                              borderColor: `${getCategoryColor(achievement.category_name)}40`,
                              color: `${getCategoryColor(achievement.category_name)}`
                            }}
                          >
                            {achievement.category_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={achievement.unlocked ? "default" : "secondary"}
                      className="font-mono"
                    >
                      +{achievement.points_reward}
                    </Badge>
                  </div>
                  <CardDescription className="leading-relaxed">
                    {achievement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Criteria */}
                    <div className="text-sm">
                      <div className="font-medium text-muted-foreground mb-1">Requirements:</div>
                      <div className="flex items-center gap-2">
                        {achievement.criteria_type === 'solves_count' && (
                          <>
                            <Trophy className="h-4 w-4" />
                            <span>
                              Solve {achievement.criteria_value} 
                              {achievement.category_name ? ` ${achievement.category_name}` : ''} 
                              challenge{achievement.criteria_value !== 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                        {achievement.criteria_type === 'points_total' && (
                          <>
                            <Star className="h-4 w-4" />
                            <span>Earn {achievement.criteria_value} total points</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between text-sm">
                      <div className={`font-medium ${
                        achievement.unlocked ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                        {achievement.unlocked ? (
                          <div className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" />
                            <span>Unlocked on {achievement.unlocked_at_formatted}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Not yet unlocked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {getFilteredAchievements().length === 0 && (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No achievements found</h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'unlocked' 
                  ? "You haven't unlocked any achievements yet. Start solving challenges!"
                  : "All achievements are unlocked! Great job!"}
              </p>
              {activeTab === 'locked' && (
                <Button onClick={() => setActiveTab('all')}>
                  View All Achievements
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}