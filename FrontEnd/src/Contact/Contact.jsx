"use client"

import { useState, useEffect } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Label } from "../Components/ui/label"
import { Textarea } from "../Components/ui/textarea"
import { Mail, MessageSquare, Phone, Send, MapPin } from "lucide-react"

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Add logic for backend integration here
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      {/* Expanded container to match the leaderboard width */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 md:px-12 py-12">
        
        {/* Header Section */}
        <div className="mb-12 border-b border-slate-200 pb-8">
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Contact Support</h1>
          <p className="text-slate-500 mt-3 text-lg max-w-2xl">
            Have a technical issue or a question about a challenge? Reach out to our community leads.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Left Column: Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md bg-white overflow-hidden group">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Email Us</CardTitle>
                  <CardDescription>support@cyberedu.com</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-md bg-white overflow-hidden group">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Community</CardTitle>
                  <CardDescription>Join our forum discussions</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-md bg-white overflow-hidden group">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Direct Line</CardTitle>
                  <CardDescription>24/7 Community Support</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-xl bg-white p-2">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold">Inquiry Terminal</CardTitle>
                <CardDescription>All transmissions are encrypted. Expect a response within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</Label>
                      <Input id="name" placeholder="John Doe" className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-12" required />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
                      <Input id="email" type="email" placeholder="john@example.com" className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-12" required />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-slate-400">Subject</Label>
                    <Input id="subject" placeholder="Bug Report / General Inquiry" className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-12" required />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-slate-400">Message Payload</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Detailed description of your request..." 
                      className="bg-slate-50 border-slate-200 focus:bg-white transition-all min-h-[200px] resize-none" 
                      required 
                    />
                  </div>

                  <Button size="lg" className="w-full md:w-fit px-12 h-14 text-lg font-bold gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                    {loading ? "Processing..." : <><Send className="h-5 w-5" /> Execute Transmission</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}