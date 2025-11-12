import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Badge } from "../Components/ui/badge"
import { Button } from "../Components/ui/button"
import { Users, Target, Shield, GraduationCap, Globe, Award, Code } from "lucide-react"
import { Link } from "react-router-dom"

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Duje Duplančić",
      role: "CyberSec Student & Web Developer",
      expertise: "Binary Exploitation, Reverse Engineering, Web Security",
      bio: "Passionate about low-level programming and web application security",
    },
    {
      name: "Vittorio Mihaljević Parat",
      role: "CyberSec Student & Web Developer", 
      expertise: "Cryptography, Reverse Engineering, Web Security",
      bio: "Interested in encryption algorithms and secure web development",
    },
  ]

  const features = [
    {
      icon: Target,
      title: "Hands-On Learning",
      description: "Practical challenges that simulate real-world security scenarios and vulnerabilities.",
    },
    {
      icon: Shield,
      title: "Safe Environment",
      description: "Learn ethical hacking in a controlled, legal environment designed for education.",
    },
    {
      icon: GraduationCap,
      title: "Expert-Led Content",
      description: "Video lectures and tutorials created by industry professionals and security researchers.",
    },
    {
      icon: Globe,
      title: "Global Community",
      description: "Connect with thousands of security enthusiasts worldwide through our forum.",
    },
    {
      icon: Code,
      title: "Multiple Categories",
      description: "Master reverse engineering, binary exploitation, cryptography, steganography, and web security.",
    },
    {
      icon: Award,
      title: "Competitive CTF",
      description: "Compete in Capture The Flag challenges and climb the global leaderboard.",
    },
  ]

  const stats = [
    { label: "Active Challenges", value: "117+" },
    { label: "Video Lectures", value: "45+" },
    { label: "Registered Users", value: "2.5K+" },
    { label: "Flags Captured", value: "8.2K+" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-mono">
              About CyberEdu
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Empowering the Next Generation of <span className="text-primary">Cybersecurity Experts</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              CyberEdu is a comprehensive platform designed to teach cybersecurity through hands-on Capture The Flag challenges, 
              expert-led video lectures, and an active community of security enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/ctf">Explore Challenges</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/lectures">View Lectures</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose CyberEdu?</h2>
              <p className="text-lg text-muted-foreground text-balance">
                Our platform offers everything you need to master cybersecurity, from beginner to expert level.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="container mx-auto py-16 md:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet the Creators</h2>
              <p className="text-lg text-muted-foreground text-balance">
                Developed by cybersecurity students passionate about education and hands-on learning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {teamMembers.map((member) => (
                <Card key={member.name} className="text-center">
                  <CardHeader>
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>{member.name}</CardTitle>
                    <CardDescription>{member.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {member.expertise.split(', ').map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Ready to Start Your Cybersecurity Journey?</h2>
            <p className="text-lg text-muted-foreground text-balance">
              Join thousands of learners and start mastering cybersecurity today.
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