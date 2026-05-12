"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { Card } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Textarea } from "../Components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import {
  Search, Paperclip, Smile, Send, Phone, Video,
  MoreVertical, MessageSquare, ArrowLeft, CheckCheck
} from "lucide-react"

// =====================================================================
// MOCK PODACI: Lista kontakata/razgovora
// U produkciji bi se dohvaćalo iz backend-a (npr. /Backend/chat/contacts.php)
// =====================================================================
const INITIAL_CONTACTS = [
  {
    id: 1,
    name: "Ana Kovač",
    avatar: null,
    online: true,
    lastMessage: "Did you solve the SQL injection challenge?",
    lastMessageTime: "10:42",
    unread: 2,
    role: "CTF Player"
  },
  {
    id: 2,
    name: "Marko Horvat",
    avatar: null,
    online: true,
    lastMessage: "Sending you the Burp config now",
    lastMessageTime: "10:15",
    unread: 0,
    role: "Mentor"
  },
  {
    id: 3,
    name: "Ivana Babić",
    avatar: null,
    online: false,
    lastMessage: "Thanks for the hint earlier!",
    lastMessageTime: "Yesterday",
    unread: 0,
    role: "Beginner"
  },
  {
    id: 4,
    name: "Luka Perić",
    avatar: null,
    online: true,
    lastMessage: "Let's pair on the reverse challenge",
    lastMessageTime: "Yesterday",
    unread: 5,
    role: "Reverse Engineer"
  },
  {
    id: 5,
    name: "Sara Tomić",
    avatar: null,
    online: false,
    lastMessage: "Nice writeup on the crypto task",
    lastMessageTime: "Mon",
    unread: 0,
    role: "Crypto"
  },
  {
    id: 6,
    name: "Filip Novak",
    avatar: null,
    online: false,
    lastMessage: "Check the new lecture on XSS",
    lastMessageTime: "Mon",
    unread: 0,
    role: "Web Security"
  },
  {
    id: 7,
    name: "Petra Jurić",
    avatar: null,
    online: true,
    lastMessage: "Ghidra script attached",
    lastMessageTime: "Sun",
    unread: 1,
    role: "Reverse Engineer"
  }
]

// =====================================================================
// MOCK PODACI: Inicijalne poruke po kontaktu
// Status 'sent' = poslano od trenutnog korisnika, 'received' = primljeno
// =====================================================================
const INITIAL_MESSAGES = {
  1: [
    { id: 1, type: "received", text: "Hey! Are you online?", time: "10:30" },
    { id: 2, type: "sent",     text: "Yes, just finished a CTF round. What's up?", time: "10:31" },
    { id: 3, type: "received", text: "Did you solve the SQL injection challenge?", time: "10:42" },
    { id: 4, type: "received", text: "I've been stuck on it for hours...", time: "10:42" }
  ],
  2: [
    { id: 1, type: "sent",     text: "Can you share your Burp Suite settings?", time: "09:58" },
    { id: 2, type: "received", text: "Sure thing", time: "10:10" },
    { id: 3, type: "received", text: "Sending you the Burp config now", time: "10:15" }
  ],
  3: [
    { id: 1, type: "received", text: "Thanks for the hint earlier!", time: "Yesterday" }
  ],
  4: [
    { id: 1, type: "received", text: "Let's pair on the reverse challenge", time: "Yesterday" }
  ],
  5: [
    { id: 1, type: "received", text: "Nice writeup on the crypto task", time: "Mon" }
  ],
  6: [
    { id: 1, type: "received", text: "Check the new lecture on XSS", time: "Mon" }
  ],
  7: [
    { id: 1, type: "received", text: "Ghidra script attached", time: "Sun" }
  ]
}

// =====================================================================
// Pomoćna funkcija za izračun inicijala iz imena - koristi se kao
// fallback kad korisnik nema avatar sliku.
// =====================================================================
const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function ChatPage() {
  // Lista svih kontakata - kasnije se može dohvaćati s backend-a
  const [contacts] = useState(INITIAL_CONTACTS)
  // Mapa: kontakt ID -> niz poruka
  const [messagesMap, setMessagesMap] = useState(INITIAL_MESSAGES)
  // Trenutno odabrani kontakt (defaultno prvi u listi)
  const [activeId, setActiveId] = useState(INITIAL_CONTACTS[0].id)
  // Tekst koji korisnik trenutno upisuje
  const [draft, setDraft] = useState("")
  // Pretraga u sidebar-u
  const [search, setSearch] = useState("")
  // Mobilni layout: kontroliramo prikaz sidebara vs chat prozora
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true)

  // Referenca na dno chat liste za auto-scroll na nove poruke
  const bottomRef = useRef(null)

  // Scroll na vrh stranice pri ulasku (konzistentno s ostalim stranicama)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Memoizirano filtriranje kontakata po pretrazi
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
    )
  }, [contacts, search])

  // Dohvat aktivnog kontakta i njegove povijesti poruka
  const activeContact = contacts.find((c) => c.id === activeId)
  const activeMessages = messagesMap[activeId] || []

  // Auto-scroll na dno chat-a pri svakoj novoj poruci
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeMessages, activeId])

  /**
   * Glavna funkcija za slanje poruke. Dodaje poruku u messagesMap,
   * prazni input polje i simulira odgovor sugovornika nakon kratke pauze.
   */
  const sendMessage = () => {
    const text = draft.trim()
    if (!text) return

    // Trenutno vrijeme u HH:MM formatu za prikaz uz poruku
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })

    const newMsg = {
      id: Date.now(),
      type: "sent",
      text,
      time
    }

    // Dodajemo poruku u mapu pod ključem aktivnog kontakta
    setMessagesMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMsg]
    }))
    setDraft("")

    // Simulacija "typing..." odgovora samo radi demo dojma (mock)
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
      const reply = {
        id: Date.now() + 1,
        type: "received",
        text: "Got it - I'll check and get back to you.",
        time: replyTime
      }
      setMessagesMap((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] || []), reply]
      }))
    }, 1200)
  }

  // Handler za Enter (bez Shift) - šalje poruku
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Klik na kontakt: postavlja aktivni razgovor i na mobilnom skriva sidebar
  const handleContactClick = (id) => {
    setActiveId(id)
    setShowSidebarOnMobile(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-8 md:py-12">

        {/* Naslovni blok stranice - identičan vizualni stil kao i ostale stranice */}
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                Messages
              </h1>
              <p className="text-slate-500 mt-1 text-base md:text-lg">
                Talk with mentors and fellow CTF players.
              </p>
            </div>
          </div>
        </div>

        {/* Glavni layout chata: sidebar + chat prozor */}
        <Card className="border-none shadow-xl bg-white overflow-hidden p-0">
          <div className="grid md:grid-cols-[340px_1fr] h-[75vh] min-h-[600px]">

            {/* =================================================== */}
            {/* SIDEBAR - lijeva strana                              */}
            {/* =================================================== */}
            <aside
              className={`border-r border-slate-100 flex flex-col ${
                showSidebarOnMobile ? "flex" : "hidden md:flex"
              }`}
            >
              {/* Search bar na vrhu sidebar-a */}
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search contacts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white h-10"
                  />
                </div>
              </div>

              {/* Lista kontakata - skrolabilna */}
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    No contacts found.
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isActive = contact.id === activeId
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleContactClick(contact.id)}
                        className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 text-left transition-colors ${
                          isActive
                            ? "bg-primary/5 border-l-4 border-l-primary"
                            : "hover:bg-slate-50 border-l-4 border-l-transparent"
                        }`}
                      >
                        {/* Avatar s indikatorom online statusa */}
                        <div className="relative shrink-0">
                          <Avatar className="h-12 w-12">
                            {contact.avatar && <AvatarImage src={contact.avatar} alt={contact.name} />}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          {/* Zelena točkica - indikator online statusa */}
                          {contact.online && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                          )}
                        </div>

                        {/* Ime, role i preview zadnje poruke */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 truncate">
                              {contact.name}
                            </span>
                            <span className="text-xs text-slate-400 shrink-0">
                              {contact.lastMessageTime}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs text-slate-500 truncate">
                              {contact.lastMessage}
                            </span>
                            {/* Badge za broj nepročitanih poruka */}
                            {contact.unread > 0 && (
                              <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                {contact.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </aside>

            {/* =================================================== */}
            {/* CHAT PROZOR - desna strana                           */}
            {/* =================================================== */}
            <section
              className={`flex flex-col bg-slate-50/50 ${
                showSidebarOnMobile ? "hidden md:flex" : "flex"
              }`}
            >
              {activeContact ? (
                <>
                  {/* Header chata - ime sugovornika, status, action ikone */}
                  <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
                    {/* Back gumb za mobilni prikaz - vraća na sidebar */}
                    <button
                      type="button"
                      onClick={() => setShowSidebarOnMobile(true)}
                      className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-900"
                      aria-label="Back to contacts"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(activeContact.name)}
                        </AvatarFallback>
                      </Avatar>
                      {activeContact.online && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {activeContact.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        {activeContact.online ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Online
                          </>
                        ) : (
                          <span>Last seen recently</span>
                        )}
                      </div>
                    </div>

                    {/* Akcijske ikone - poziv, video, više */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-primary">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-primary">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-primary">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Message area - skrolabilni prostor s porukama */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
                    {activeMessages.map((msg) => {
                      const isSent = msg.type === "sent"
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              isSent
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] ${
                                isSent ? "text-primary-foreground/70 justify-end" : "text-slate-400"
                              }`}
                            >
                              <span>{msg.time}</span>
                              {isSent && <CheckCheck className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {/* Sidro za auto-scroll na dno */}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input area - polje za unos s ikonama i Send gumbom */}
                  <div className="border-t border-slate-100 bg-white p-3 md:p-4">
                    <div className="flex items-end gap-2">
                      {/* Ikona za privitak (paperclip) */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-slate-500 hover:text-primary"
                        aria-label="Attach file"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>

                      {/* Ikona za emoji */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-slate-500 hover:text-primary"
                        aria-label="Emoji"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>

                      {/* Glavno tekstualno polje - Textarea zbog višelinijskog unosa */}
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-slate-50 border-slate-200 focus:bg-white min-h-[44px] max-h-[120px] resize-none py-3"
                      />

                      {/* Veliki Send gumb */}
                      <Button
                        type="button"
                        size="lg"
                        onClick={sendMessage}
                        disabled={!draft.trim()}
                        className="h-11 px-5 gap-2 shadow-md shadow-primary/20 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // Empty state ako nema odabranog kontakta
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageSquare className="h-16 w-16 text-slate-200 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm">
                    Choose a contact from the sidebar to start messaging.
                  </p>
                </div>
              )}
            </section>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
