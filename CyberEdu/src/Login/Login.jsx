import React from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
// import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Label } from "../Components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../Components/ui/card"
import { Link } from "react-router-dom"
import { Terminal } from "lucide-react"

export default function LoginPage() {
  const [activeTab, setActiveTab] = React.useState("login")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Terminal className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Welcome to CyberEdu</h1>
            <p className="text-muted-foreground">Sign in to access challenges and track your progress</p>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab("login")}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "login" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "register" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {activeTab === "login" && (
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="name@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <Link to="/forgot-password" className="text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Sign In</Button>
              </CardFooter>
            </Card>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Sign up to start your cybersecurity journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input id="register-username" placeholder="cyb3r_ninja" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input id="register-email" type="email" placeholder="name@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input id="register-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm">Confirm Password</Label>
                  <Input id="register-confirm" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Create Account</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}