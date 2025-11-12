import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { ImageIcon, Play, Clock, BarChart } from "lucide-react"

export default function LecturesPage() {
  const lectures = [
    {
      id: 1,
      title: "Introduction to Reverse Engineering",
      category: "Reverse Engineering",
      instructor: "Dr. Sarah Chen",
      duration: "45 min",
      level: "Beginner",
      students: 1234,
      thumbnail: "/code-disassembly-debugging.jpg",
    },
    {
      id: 2,
      title: "Buffer Overflow Exploitation",
      category: "Binary Exploitation",
      instructor: "Mike Johnson",
      duration: "60 min",
      level: "Intermediate",
      students: 876,
      thumbnail: "/binary-exploitation-memory.jpg",
    },
    {
      id: 3,
      title: "Modern Cryptography Fundamentals",
      category: "Cryptography",
      instructor: "Prof. Alex Kumar",
      duration: "55 min",
      level: "Beginner",
      students: 1456,
      thumbnail: "/encryption-cryptography-security.jpg",
    },
    {
      id: 4,
      title: "Web Application Security",
      category: "Web",
      instructor: "Emily Rodriguez",
      duration: "70 min",
      level: "Intermediate",
      students: 1098,
      thumbnail: "/web-security-hacking.jpg",
    },
    {
      id: 5,
      title: "Steganography Techniques",
      category: "Steganography",
      instructor: "David Park",
      duration: "40 min",
      level: "Beginner",
      students: 654,
      thumbnail: "/steganography-hidden-messages.jpg",
    },
    {
      id: 6,
      title: "Advanced ROP Chains",
      category: "Binary Exploitation",
      instructor: "Lisa Wong",
      duration: "80 min",
      level: "Advanced",
      students: 432,
      thumbnail: "/rop-chains-exploitation.jpg",
    },
  ]

  const getLevelColor = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Advanced":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Video Lectures</h1>
          <p className="text-lg text-muted-foreground">
            Learn from expert instructors through comprehensive video tutorials covering all aspects of cybersecurity.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lectures.map((lecture) => (
            <Card key={lecture.id} className="group hover:border-primary/50 transition-all overflow-hidden">
              <div className="relative aspect-video overflow-hidden bg-muted">
                <div className="w-full h-full flex items-center justify-center bg-muted group-hover:scale-105 transition-transform duration-300">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="lg" className="rounded-full h-16 w-16 p-0">
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
                </div>
                <Badge className={`absolute top-3 right-3 ${getLevelColor(lecture.level)}`} variant="outline">
                  {lecture.level}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-2">{lecture.title}</CardTitle>
                <CardDescription>{lecture.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">By {lecture.instructor}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {lecture.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart className="h-4 w-4" />
                      {lecture.students} students
                    </span>
                  </div>
                  <Button className="w-full">Watch Lecture</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}