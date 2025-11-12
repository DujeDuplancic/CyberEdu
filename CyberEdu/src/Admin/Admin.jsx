import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Users, Flag, BookOpen, MessageSquare, Plus } from "lucide-react"
import { useState } from "react"
export default function AdminPage() {
  const stats = [
    { label: "Total Users", value: "2,547", icon: Users, change: "+12%" },
    { label: "Active Challenges", value: "117", icon: Flag, change: "+3" },
    { label: "Total Lectures", value: "45", icon: BookOpen, change: "+2" },
    { label: "Forum Posts", value: "18,392", icon: MessageSquare, change: "+456" },
  ]

  const recentUsers = [
    { username: "new_hacker", email: "new@example.com", joined: "2 hours ago", status: "Active" },
    { username: "cyber_student", email: "student@example.com", joined: "5 hours ago", status: "Active" },
    { username: "security_pro", email: "pro@example.com", joined: "1 day ago", status: "Active" },
  ]

  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">Manage users, challenges, content, and platform settings.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 p-1 bg-muted rounded-lg">
          {["users", "challenges", "content", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage registered users and permissions</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsers.map((user) => (
                    <div
                      key={user.username}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">Joined {user.joined}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Suspend
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Challenge Management</CardTitle>
                  <CardDescription>Create and manage CTF challenges</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Challenge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Challenge management interface...</p>
            </CardContent>
          </Card>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>Manage lectures, wiki articles, and educational content</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Content
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content management interface...</p>
            </CardContent>
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings interface...</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}