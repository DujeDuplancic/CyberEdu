import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { MessageSquare, TrendingUp, Clock, User } from "lucide-react"

export default function CommunityPage() {
  const discussions = [
    {
      id: 1,
      title: "Best approach for learning reverse engineering?",
      author: "beginner_hacker",
      category: "Reverse Engineering",
      replies: 24,
      views: 342,
      lastActivity: "2 hours ago",
      isPinned: true,
    },
    {
      id: 2,
      title: "Writeup: RSA Decryption Challenge",
      author: "crypto_master",
      category: "Cryptography",
      replies: 15,
      views: 289,
      lastActivity: "5 hours ago",
      isPinned: false,
    },
    {
      id: 3,
      title: "Tips for buffer overflow exploitation",
      author: "binary_ninja",
      category: "Binary Exploitation",
      replies: 32,
      views: 567,
      lastActivity: "1 day ago",
      isPinned: false,
    },
    {
      id: 4,
      title: "XSS payload collection for testing",
      author: "web_security_pro",
      category: "Web",
      replies: 18,
      views: 423,
      lastActivity: "1 day ago",
      isPinned: false,
    },
    {
      id: 5,
      title: "Steganography tools recommendation",
      author: "stego_lover",
      category: "Steganography",
      replies: 12,
      views: 198,
      lastActivity: "2 days ago",
      isPinned: false,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Community Forum</h1>
              <p className="text-lg text-muted-foreground">
                Connect with fellow hackers, share writeups, and discuss cybersecurity topics.
              </p>
            </div>
            <Button size="lg">New Discussion</Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Topics</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,847</div>
                <p className="text-xs text-muted-foreground mt-1">+127 this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Members</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,534</div>
                <p className="text-xs text-muted-foreground mt-1">Online now</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18,392</div>
                <p className="text-xs text-muted-foreground mt-1">+456 this week</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Discussions</CardTitle>
              <CardDescription>Join the conversation and share your knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-4 flex-1">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback>{discussion.author[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {discussion.isPinned && (
                            <Badge variant="secondary" className="text-xs">
                              Pinned
                            </Badge>
                          )}
                          <h3 className="font-semibold truncate">{discussion.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span>{discussion.author}</span>
                          <Badge variant="outline">{discussion.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {discussion.replies} replies
                          </span>
                          <span>{discussion.views} views</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {discussion.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}