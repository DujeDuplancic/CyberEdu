import { Link } from "react-router-dom"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Lock, Code, Key, ImageIcon, Globe, Search, BookOpen } from "lucide-react"

export default function WikiPage() {
  const categories = [
    {
      icon: Code,
      name: "Reverse Engineering",
      slug: "reverse-engineering",
      description: "Learn disassembly, debugging, and binary analysis techniques.",
      articles: 28,
    },
    {
      icon: Lock,
      name: "Binary Exploitation",
      slug: "binary-exploitation",
      description: "Master buffer overflows, ROP chains, and memory corruption.",
      articles: 22,
    },
    {
      icon: Key,
      name: "Cryptography",
      slug: "cryptography",
      description: "Understand encryption algorithms, hashing, and cryptanalysis.",
      articles: 35,
    },
    {
      icon: ImageIcon,
      name: "Steganography",
      slug: "steganography",
      description: "Discover hidden messages in digital media and files.",
      articles: 18,
    },
    {
      icon: Globe,
      name: "Web Security",
      slug: "web",
      description: "Explore web vulnerabilities and exploitation techniques.",
      articles: 32,
    },
  ]

  const popularArticles = [
    { title: "Getting Started with Reverse Engineering", category: "Reverse Engineering", views: 1234 },
    { title: "Understanding Buffer Overflows", category: "Binary Exploitation", views: 987 },
    { title: "RSA Cryptography Explained", category: "Cryptography", views: 856 },
    { title: "SQL Injection Techniques", category: "Web Security", views: 743 },
    { title: "LSB Steganography Tutorial", category: "Steganography", views: 621 },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Knowledge Base</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Comprehensive guides, tutorials, and documentation for learning cybersecurity concepts.
            </p>

            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-9" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {categories.map((category) => (
              <Link key={category.slug} to={`/wiki/${category.slug}`}>
                <Card className="h-full hover:border-primary/50 transition-all duration-300 group">
                  <CardHeader>
                    <category.icon className="h-10 w-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                    <CardTitle className="flex items-center justify-between">
                      {category.name}
                      <span className="text-sm font-normal text-muted-foreground">{category.articles} articles</span>
                    </CardTitle>
                    <CardDescription className="leading-relaxed">{category.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Popular Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularArticles.map((article) => (
                  <Link
                    key={article.title}
                    to={`/wiki/${article.category.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex items-start justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-1">
                      <p className="font-semibold group-hover:text-primary transition-colors">{article.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{article.category}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{article.views} views</span>
                  </Link>
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