"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "../Components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Textarea } from "../Components/ui/textarea"
import { Badge } from "../Components/ui/badge"
import { Bot, Send, Shield, Wrench, Flag, Sparkles, User, Loader2, AlertTriangle } from "lucide-react"

// Konstanta s URL-om backend endpoint-a (isti pattern kao u Admin/Ctf stranicama)
const API_URL = "http://localhost/CyberEdu/Backend/ai/ai_assistant.php"

// Pozdravna poruka koju asistent uvijek šalje na početku razgovora
const INITIAL_GREETING = {
  role: "assistant",
  content:
    "Hello, operator. I'm **SentinelAI**, your dedicated cybersecurity assistant.\n\nI can help you with:\n- CTF challenge **hints** (never full solutions)\n- Tool recommendations (Burp Suite, Nmap, Ghidra, Wireshark, ...)\n- Concepts in web security, reverse engineering, cryptography & more\n\nHow can I assist you today?"
}

// Brze akcije (chip-ovi) koje korisniku ubrzavaju upit
const QUICK_ACTIONS = [
  { icon: Flag, label: "Hint for a CTF challenge", prompt: "I'm stuck on a CTF challenge. Can you give me a hint without revealing the solution?" },
  { icon: Wrench, label: "Recommend a tool", prompt: "Which tool should I use to start with web application penetration testing?" },
  { icon: Shield, label: "Explain a concept", prompt: "Can you explain how SQL injection works and how to prevent it?" },
  { icon: Sparkles, label: "Learning roadmap", prompt: "Suggest a learning roadmap for someone starting with cybersecurity." }
]

export default function AssistantPage() {
  // Stanje povijesti razgovora - lista poruka s ulogama "user"/"assistant"
  const [messages, setMessages] = useState([INITIAL_GREETING])
  // Trenutno upisana poruka u tekstualnom polju
  const [input, setInput] = useState("")
  // Indikator da čekamo odgovor backenda
  const [loading, setLoading] = useState(false)
  // Eventualna greška prilikom poziva API-ja
  const [error, setError] = useState(null)

  // Referenca na dno chat-a kako bi mogli automatski scrollati
  const bottomRef = useRef(null)

  // Scroll na vrh stranice pri ulasku (konzistentno s ostalim stranicama)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Lock cijele stranice na viewport dok je korisnik na AI chat stranici.
  // Skrola se samo područje poruka unutar chat kartice.
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [])

  // Auto-scroll na dno chat liste pri svakoj novoj poruci ili promjeni stanja učitavanja
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  /**
   * Glavna funkcija za slanje poruke prema backendu.
   * Šalje cijelu povijest razgovora kako bi model imao kontekst.
   */
  const sendMessage = async (text) => {
    const trimmed = (text ?? "").trim()
    if (!trimmed || loading) return

    setError(null)

    // Dodajemo korisničku poruku u stanje prije poziva backenda
    const newHistory = [...messages, { role: "user", content: trimmed }]
    setMessages(newHistory)
    setInput("")
    setLoading(true)

    try {
      // Slanje povijesti razgovora (bez početnog pozdrava jer je samo UI element)
      const payload = {
        messages: newHistory.filter((_, idx) => idx !== 0)
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Unknown error from the AI service.")
      }

      // Dodajemo odgovor asistenta u povijest razgovora
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch (err) {
      // Prikaz greške korisniku i logiranje u konzolu
      console.error("AI Assistant error:", err)
      setError(err.message || "Failed to contact the AI assistant.")
    } finally {
      setLoading(false)
    }
  }

  // Handler za submit forme (Enter ili klik na gumb)
  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Handler za Enter (bez Shift) - šalje poruku; Shift+Enter ostavlja novi red
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  /**
   * Pomoćna funkcija za pretvaranje vrlo jednostavnog Markdown-a
   * (bold, kod) u HTML. Koristi se samo za poruke asistenta.
   */
  const renderMarkdown = (text) => {
    // Escape osnovnih HTML znakova radi sigurnosti (XSS prevencija)
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    // Zamjena Markdown stila s HTML tagovima
    const html = escaped
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 text-slate-100 rounded-md p-3 my-2 overflow-x-auto text-xs font-mono"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-primary">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-5 list-disc">$1</li>')
      .replace(/\n/g, "<br/>")

    return { __html: html }
  }

  return (
    // h-screen + overflow-hidden -> stranica je lockna na visinu prozora dok chatamo
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-6 md:px-12 py-6 flex flex-col">

        {/* Naslovni blok stranice - kompaktniji da ostane mjesta za chat */}
        {/* Kompaktniji naslov - mora ostati mjesta za chat unutar viewport visine */}
        <div className="mb-4 border-b border-slate-200 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  SentinelAI Assistant
                </h1>
                <Badge variant="outline" className="font-mono text-[10px]">
                  Powered by Llama 3.3 70B (Groq)
                </Badge>
              </div>
              <p className="text-slate-500 text-sm mt-0.5 hidden md:block">
                Your AI co-pilot for cybersecurity - hints, tools, concepts.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* Lijevi stupac - info kartice i brze akcije s tanjim scrollbar-om
              (da glavni chat scrollbar ostane vizualno dominantan) */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">

            <Card className="border-none shadow-md bg-white overflow-hidden group">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Scope</CardTitle>
                  <CardDescription>Cybersecurity topics only</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-md bg-white overflow-hidden group">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <Flag className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">CTF Hints</CardTitle>
                  <CardDescription>Guidance without spoilers</CardDescription>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-md bg-white overflow-hidden group">
              <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-blue-50 rounded-lg text-primary">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tool Picks</CardTitle>
                  <CardDescription>Burp, Nmap, Ghidra & more</CardDescription>
                </div>
              </CardHeader>
            </Card>

            {/* Sekcija brzih akcija - klik popunjava chat polje i šalje poruku */}
            <Card className="border-none shadow-md bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold uppercase tracking-widest text-slate-500">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.label}
                      type="button"
                      disabled={loading}
                      onClick={() => sendMessage(action.prompt)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-md bg-slate-50 hover:bg-primary/10 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Desni stupac - chat sučelje. min-h-0 + h-full kako bi Card mogao
              biti flex-1 i savršeno popuniti viewport bez page scrolla. */}
          <div className="lg:col-span-2 min-h-0 h-full">
            <Card className="border-none shadow-xl bg-white p-2 flex flex-col h-full">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  Conversation
                </CardTitle>
                <CardDescription>
                  Encrypted session. Conversation history is sent for context.
                </CardDescription>
              </CardHeader>

              {/* Lista poruka - uvijek vidljiv prominent scrollbar */}
              <CardContent className="flex-1 overflow-y-scroll py-6 space-y-6 min-h-0 [scrollbar-width:auto] [scrollbar-color:rgb(100_116_139)_rgb(241_245_249)] [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-slate-100 [&::-webkit-scrollbar-thumb]:min-h-[40px]">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === "user"
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="p-2 h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Bot className="h-5 w-5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-slate-100 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        {isUser ? (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        ) : (
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                          />
                        )}
                      </div>
                      {isUser && (
                        <div className="p-2 h-9 w-9 shrink-0 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Indikator učitavanja dok čekamo odgovor */}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="p-2 h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      SentinelAI is thinking...
                    </div>
                  </div>
                )}

                {/* Prikaz eventualne API greške */}
                {error && (
                  <div className="flex gap-3 justify-start">
                    <div className="p-2 h-9 w-9 shrink-0 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="bg-destructive/10 text-destructive rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                      <strong>Connection error:</strong> {error}
                    </div>
                  </div>
                )}

                {/* Nevidljivi sidro element za auto-scroll */}
                <div ref={bottomRef} />
              </CardContent>

              {/* Forma za unos nove poruke - prikvačena na dno kartice */}
              <form
                onSubmit={handleSubmit}
                className="border-t border-slate-100 p-4 flex items-end gap-3"
              >
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about a CTF hint, a tool, or a security concept... (Shift+Enter for new line)"
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all min-h-[60px] max-h-[160px] resize-none"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-[60px] px-6 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span className="hidden md:inline">Send</span>
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
      {/* Footer namjerno izostavljen - stranica je lockna na viewport */}
    </div>
  )
}
