import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Trophy, Medal, Award } from "lucide-react"

export default function LeaderboardPage() {
  const topUsers = [
    { rank: 1, username: "cyb3r_ninja", points: 8450, solves: 67, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 2, username: "hackmaster_pro", points: 7820, solves: 62, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 3, username: "code_breaker", points: 7340, solves: 58, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 4, username: "binary_wizard", points: 6890, solves: 54, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 5, username: "exploit_king", points: 6520, solves: 51, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 6, username: "crypto_queen", points: 6180, solves: 48, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 7, username: "web_hunter", points: 5940, solves: 46, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 8, username: "reverse_master", points: 5670, solves: 44, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 9, username: "steg0_solver", points: 5420, solves: 42, avatar: "/placeholder.svg?height=40&width=40" },
    { rank: 10, username: "pwn_warrior", points: 5180, solves: 40, avatar: "/placeholder.svg?height=40&width=40" },
  ]

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-700" />
      default:
        return <span className="font-mono font-semibold text-muted-foreground">#{rank}</span>
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Leaderboard</h1>
          <p className="text-lg text-muted-foreground">
            Top players ranked by total points earned from solved challenges.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {topUsers.slice(0, 3).map((user, idx) => (
            <Card key={user.username} className="relative overflow-hidden border-primary/20">
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : "bg-amber-700"
                }`}
              />
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  {getRankIcon(user.rank)}
                  <Badge variant="secondary">{user.points} pts</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{user.username}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.solves} solves</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.map((user) => (
                <div
                  key={user.username}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 flex justify-center">{getRankIcon(user.rank)}</div>
                    <Avatar>
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.solves} challenges solved</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {user.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}