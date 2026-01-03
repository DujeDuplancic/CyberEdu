import { useState, useEffect } from 'react';
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Button } from "../Components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Lock, Code, Key, ImageIcon, Globe, Trophy, Users, BookOpen, ChevronRight, Search, Smartphone } from "lucide-react"
import { Link } from "react-router-dom"
import cyberSecHacker from '../public/cybersecurity-hacker-terminal-dark-theme-code.jpg'
import cyberSecCodeEditor from '../public/cybersecurity-code-editor-terminal-hacking.jpg'
import { api } from '../lib/api';

// Icon mapping object
const iconComponents = {
  Code,
  Lock,
  Key,
  ImageIcon,
  Globe,
  Search,
  Smartphone,
  Trophy,
  Users,
  BookOpen
};

export default function HomePage() {
  const [stats, setStats] = useState({
    activeChallenges: 117,
    activeUsers: 2500,
    videoLectures: 45,
    flagsCaptured: 8200
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  const fetchHomepageData = async () => {
    try {
      // Fetch stats
      const statsResponse = await api.get('/homepage/get_stats.php');
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
      
      // Fetch categories
      const categoriesResponse = await api.get('/homepage/get_categories.php');
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories);
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Trophy,
      title: "Competitive CTF",
      description: "Compete with hackers worldwide and climb the leaderboard.",
    },
    {
      icon: BookOpen,
      title: "Educational Lectures",
      description: "Learn from comprehensive video tutorials and written guides.",
    },
    {
      icon: Users,
      title: "Active Community",
      description: "Join discussions, share writeups, and collaborate with peers.",
    },
  ]

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k+';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto py-16 md:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-mono">
              CTF Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Master Cybersecurity Through <span className="text-primary">Capture The Flag</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Learn offensive security, exploit vulnerabilities, and develop real-world hacking skills through hands-on
              challenges and comprehensive educational resources.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link to="/lectures">Get Started with Lectures</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
                <Link to="/ctf">Browse Challenges</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Hero Image Placeholder */}
        <section className="container mx-auto pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto">
            <img
              src={cyberSecHacker}
              alt="Cybersecurity CTF Platform"
              className="w-full rounded-lg border border-border shadow-2xl"
            />
          </div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto py-16 md:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Challenge Categories</h2>
              <p className="text-lg text-muted-foreground text-balance">
                Master core cybersecurity domains through progressive challenges
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const IconComponent = iconComponents[category.icon] || Code;
                  return (
                    <Card key={category.name} className="group hover:border-primary/50 transition-all duration-300">
                      <CardHeader>
                        <IconComponent className={`h-12 w-12 mb-4 ${category.color}`} />
                        <CardTitle className="flex items-center justify-between">
                          {category.name}
                          <Badge variant="secondary">{category.challenge_count || 0}</Badge>
                        </CardTitle>
                        <CardDescription className="leading-relaxed">{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Link
                          to={`/ctf?category=${encodeURIComponent(category.name)}`}
                          className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          View Challenges <ChevronRight className="h-4 w-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Why Choose CyberEdu?</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  CyberEdu provides a comprehensive platform for learning cybersecurity through practical, hands-on
                  experience. Whether you're a beginner or an expert, we have challenges for every skill level.
                </p>

                <div className="space-y-6">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button asChild>
                    <Link to="/register">Create Account</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/about">Learn More</Link>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src={cyberSecCodeEditor}
                  alt="CTF Platform Features"
                  className="w-full rounded-lg border border-border shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto py-16 md:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {loading ? '...' : formatNumber(stats.activeChallenges)}
                </div>
                <div className="text-sm text-muted-foreground">Active Challenges</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {loading ? '...' : formatNumber(stats.activeUsers)}
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {loading ? '...' : formatNumber(stats.videoLectures)}
                </div>
                <div className="text-sm text-muted-foreground">Video Lectures</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {loading ? '...' : formatNumber(stats.flagsCaptured)}
                </div>
                <div className="text-sm text-muted-foreground">Flags Captured</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Start Your Security Journey?</h2>
            <p className="text-lg text-muted-foreground text-balance">
              Join thousands of security enthusiasts and start learning today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/register">Create Free Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}