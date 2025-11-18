import React, { useState } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Label } from "../Components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../Components/ui/card"
import { Link, useNavigate } from "react-router-dom"
import { Terminal } from "lucide-react"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    // Validacija
    if (formData.password !== formData.confirmPassword) {
      setMessage("Lozinke se ne podudaraju!")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setMessage("Lozinka mora imati najmanje 6 znakova!")
      setLoading(false)
      return
    }

    try {
      console.log("🔄 Pokrećem registraciju...")
      
      // ISPRAVAN URL - dodan dupli CyberEdu
      const response = await fetch('http://localhost/CyberEdu/CyberEdu/Backend/auth/register.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      })

      console.log("📡 Status odgovora:", response.status)
      
      const data = await response.json()
      console.log("📨 Podaci sa servera:", data)

      if (data.success) {
        setMessage("✅ Registracija uspješna! Preusmjeravam na login...")
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        setMessage(`❌ ${data.message}`)
      }
    } catch (error) {
      console.error('❌ Greška:', error)
      setMessage("❌ Greška pri spajanju na server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Terminal className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Join CyberEdu</h1>
            <p className="text-muted-foreground">Create your account to start your cybersecurity journey</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Sign up to start your cybersecurity journey</CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-md text-sm ${
                    message.includes('✅') 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="cyb3r_ninja" 
                    value={formData.username}
                    onChange={handleChange}
                    required
                    minLength={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
                
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}