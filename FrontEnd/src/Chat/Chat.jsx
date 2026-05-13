"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Header } from "../Components/Header"
import { Card } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Textarea } from "../Components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import {
  Search, Paperclip, Smile, Send,
  MessageSquare, ArrowLeft, CheckCheck, Loader2, AlertTriangle, RefreshCw,
  X, FileText, Download, UserPlus
} from "lucide-react"

// =====================================================================
// Endpoint-i backenda
// =====================================================================
const API_BASE     = "http://localhost/CyberEdu/Backend/chat"
const CONTACTS_URL = `${API_BASE}/get_contacts.php`
const MESSAGES_URL = `${API_BASE}/get_messages.php`
const SEND_URL     = `${API_BASE}/send_message.php`
const UPLOAD_URL   = `${API_BASE}/upload_attachment.php`

// Privici su servirani direktno s XAMPP-a iz /CyberEdu/uploads/chat/...
const FILE_HOST = "http://localhost"

// Intervali polling-a
const CONTACTS_POLL_MS = 8000
const MESSAGES_POLL_MS = 3000

// =====================================================================
// Brzi inline emoji picker - mali set najčešćih emojija po kategorijama
// (bez vanjske biblioteke; insert na trenutni cursor položaj).
// =====================================================================
const EMOJI_GROUPS = [
  { name: "Smiles", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚","😋","😛","😜","🤪","😎","🤓","🧐","🤔","😐","😶","😏","🙄","😴"] },
  { name: "Reactions", emojis: ["👍","👎","👌","🤝","🙌","👏","🙏","💪","🤞","✌️","👋","🤘","🤙","🫡","🫶","❤️","💔","🔥","✨","🎉","💯","💀","👀","🤡","🥳","😭","😱","😡","🤯"] },
  { name: "Tech", emojis: ["💻","🖥️","⌨️","🖱️","💾","💿","📀","📱","🔋","🔌","🛡️","🔒","🔓","🔑","🗝️","🐛","🐞","⚙️","🧠","🚀","⚡","🛠️","🧰","📡","🛰️"] },
  { name: "Hands", emojis: ["✅","❌","⚠️","❓","❗","📌","📎","📁","📂","📄","📝","🔍","🔎","💡","📊","📈","📉","🧪","🧩","🎯","🏁","🏆","🥇","🥈","🥉"] }
]

// =====================================================================
// Pomoćne funkcije
// =====================================================================

const getInitials = (name) => {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const formatSidebarTime = (iso) => {
  if (!iso) return ""
  const date = new Date(iso.replace(" ", "T"))
  if (isNaN(date.getTime())) return ""

  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false
    })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  if (isYesterday) return "Yesterday"

  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })
}

const formatMessageTime = (iso) => {
  if (!iso) return ""
  const date = new Date(iso.replace(" ", "T"))
  if (isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false
  })
}

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Resolve attachment URL servirane sa XAMPP-a (URL iz baze počinje s /CyberEdu/...)
const resolveAttachmentUrl = (url) => {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${FILE_HOST}${url}`
}

export default function ChatPage() {
  // Trenutno prijavljeni korisnik iz localStorage-a
  const [currentUser, setCurrentUser] = useState(null)

  // Server state
  const [contacts, setContacts] = useState([])
  const [messagesMap, setMessagesMap] = useState({})
  const [activeId, setActiveId] = useState(null)

  // UI state
  const [draft, setDraft] = useState("")
  const [search, setSearch] = useState("")
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Stanja loading / error
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [contactsError, setContactsError] = useState(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messagesError, setMessagesError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  // Privitak koji se sprema lokalno dok korisnik ne klikne Send
  const [pendingAttachment, setPendingAttachment] = useState(null) // { file, previewUrl }

  // Reference
  const bottomRef        = useRef(null)
  const scrollAreaRef    = useRef(null)
  const textareaRef      = useRef(null)
  const fileInputRef     = useRef(null)
  const emojiPanelRef    = useRef(null)
  const emojiButtonRef   = useRef(null)
  const contactsPollRef  = useRef(null)
  const messagesPollRef  = useRef(null)
  const activeIdRef      = useRef(null)
  // Trackeri za pametan autoscroll:
  //   prevCountRef -> broj poruka u prethodnom rendererju aktivnog razgovora
  //   isAtBottomRef -> da li je korisnik fizički blizu dna scroll prozora
  const prevCountRef     = useRef(0)
  const prevActiveIdRef  = useRef(null)
  const isAtBottomRef    = useRef(true)

  // =====================================================================
  // Učitaj prijavljenog korisnika
  // =====================================================================
  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const u = JSON.parse(raw)
        if (u && u.id) setCurrentUser(u)
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err)
    }
  }, [])

  // =====================================================================
  // Lock stranice na viewport dok je korisnik na chat ekranu.
  // Cijela stranica ne smije skrolat - skrola se samo chat područje.
  // Postavlja overflow:hidden i na html i na body radi iOS/Safari kompatibilnosti.
  // =====================================================================
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

  // =====================================================================
  // Dohvat liste kontakata
  // =====================================================================
  const fetchContacts = useCallback(
    async (silent = false) => {
      if (!currentUser?.id) return
      if (!silent) setLoadingContacts(true)

      try {
        const res = await fetch(
          `${CONTACTS_URL}?user_id=${encodeURIComponent(currentUser.id)}`
        )
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.message || `HTTP ${res.status}`)
        }
        setContacts(data.contacts || [])
        setContactsError(null)
      } catch (err) {
        console.error("Failed to fetch contacts:", err)
        if (!silent) setContactsError(err.message || "Failed to load contacts")
      } finally {
        if (!silent) setLoadingContacts(false)
      }
    },
    [currentUser]
  )

  // =====================================================================
  // Dohvat poruka aktivnog razgovora
  // =====================================================================
  const fetchMessages = useCallback(
    async (otherId, silent = false) => {
      if (!currentUser?.id || !otherId) return
      if (!silent) setLoadingMessages(true)

      try {
        const url = `${MESSAGES_URL}?user_id=${encodeURIComponent(currentUser.id)}&with=${encodeURIComponent(otherId)}`
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.message || `HTTP ${res.status}`)
        }
        setMessagesMap((prev) => ({ ...prev, [otherId]: data.messages || [] }))
        setMessagesError(null)
      } catch (err) {
        console.error("Failed to fetch messages:", err)
        if (!silent) setMessagesError(err.message || "Failed to load messages")
      } finally {
        if (!silent) setLoadingMessages(false)
      }
    },
    [currentUser]
  )

  // =====================================================================
  // Inicijalno učitavanje + polling kontakata
  // =====================================================================
  useEffect(() => {
    if (!currentUser?.id) return
    fetchContacts(false)
    contactsPollRef.current = setInterval(() => fetchContacts(true), CONTACTS_POLL_MS)
    return () => {
      if (contactsPollRef.current) clearInterval(contactsPollRef.current)
    }
  }, [currentUser, fetchContacts])

  // =====================================================================
  // Učitaj poruke + polling kad se promijeni aktivni kontakt
  // =====================================================================
  useEffect(() => {
    activeIdRef.current = activeId
    if (!activeId || !currentUser?.id) return

    fetchMessages(activeId, false)
    messagesPollRef.current = setInterval(() => {
      if (activeIdRef.current) fetchMessages(activeIdRef.current, true)
    }, MESSAGES_POLL_MS)

    return () => {
      if (messagesPollRef.current) clearInterval(messagesPollRef.current)
    }
  }, [activeId, currentUser, fetchMessages])

  // =====================================================================
  // Filtriranje kontakata za sidebar:
  //   - kad NEMA pretrage  -> samo razgovori koji postoje
  //   - kad IMA pretrage   -> svi korisnici koji odgovaraju upitu
  //     (kako bi korisnik mogao zapocet razgovor s nekim novim)
  // =====================================================================
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q) {
      return contacts.filter(
        (c) =>
          (c.username || "").toLowerCase().includes(q) ||
          (c.role || "").toLowerCase().includes(q)
      )
    }
    return contacts.filter((c) => c.has_conversation)
  }, [contacts, search])

  const activeContact = useMemo(
    () => contacts.find((c) => c.id === activeId) || null,
    [contacts, activeId]
  )
  const activeMessages = activeId ? (messagesMap[activeId] || []) : []

  // =====================================================================
  // Pametni autoscroll:
  //   - kad korisnik prebaci razgovor -> instant scroll na dno
  //   - kad stigne nova poruka I korisnik je već bio blizu dna -> scroll
  //   - kad korisnik je scrollan gore (čita stare poruke) -> NEMA scrolla
  //   - polling koji ne donosi nove poruke (ista count) -> NEMA scrolla
  // =====================================================================
  useEffect(() => {
    const conversationChanged = prevActiveIdRef.current !== activeId
    const count = activeMessages.length
    const newMessage = count > prevCountRef.current

    if (conversationChanged) {
      // Skok u novi razgovor - bez animacije, odmah na dno
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" })
      })
      isAtBottomRef.current = true
    } else if (newMessage && isAtBottomRef.current) {
      // Stigla je nova poruka i korisnik je već bio na dnu -> nježno scrollaj
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    prevCountRef.current = count
    prevActiveIdRef.current = activeId
  }, [activeMessages, activeId])

  // Prati scroll položaj u prozoru poruka da znamo je li korisnik blizu dna.
  // 80px tolerancije - dovoljno da male autorezize promjene ne mijenjaju stanje.
  const handleScroll = () => {
    const el = scrollAreaRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distanceFromBottom < 80
  }

  // =====================================================================
  // Emoji picker - klik izvan zatvara
  // =====================================================================
  useEffect(() => {
    if (!showEmojiPicker) return
    const handler = (e) => {
      if (
        emojiPanelRef.current?.contains(e.target) ||
        emojiButtonRef.current?.contains(e.target)
      ) return
      setShowEmojiPicker(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showEmojiPicker])

  // Insert emojija na trenutnu poziciju cursora u textarea
  const insertEmoji = (emoji) => {
    const ta = textareaRef.current
    if (!ta) {
      setDraft((d) => d + emoji)
      return
    }
    const start = ta.selectionStart ?? draft.length
    const end   = ta.selectionEnd   ?? draft.length
    const next  = draft.slice(0, start) + emoji + draft.slice(end)
    setDraft(next)
    // Vrati fokus i postavi cursor iza ubačenog emojija (1 frame nakon re-rendera)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + emoji.length
      ta.setSelectionRange(pos, pos)
    })
  }

  // =====================================================================
  // File picker + privitak preview
  // =====================================================================
  const onFileButtonClick = () => fileInputRef.current?.click()

  const onFileSelected = (e) => {
    const file = e.target.files?.[0]
    // Reset input value da se isti file može ponovno odabrati nakon clear-a
    e.target.value = ""
    if (!file) return

    // 25 MB hard limit klijentske strane (mirror backenda)
    if (file.size > 25 * 1024 * 1024) {
      setSendError("File too large. Maximum size is 25 MB.")
      return
    }

    // Local preview URL za slike
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null

    setPendingAttachment({ file, previewUrl })
    setSendError(null)
  }

  const clearPendingAttachment = () => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl)
    }
    setPendingAttachment(null)
  }

  // =====================================================================
  // Slanje poruke (tekst i/ili privitak)
  // =====================================================================
  const sendMessage = async () => {
    const text = draft.trim()
    if ((!text && !pendingAttachment) || sending || !currentUser?.id || !activeId) return

    setSending(true)
    setSendError(null)

    // Pošto saljemo NOVU poruku, sigurno želimo scroll na dno
    isAtBottomRef.current = true

    // Optimistic record
    const tempId = -Date.now()
    const optimisticMsg = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: activeId,
      type: "sent",
      content: text,
      attachment_url:  pendingAttachment ? pendingAttachment.previewUrl : null,
      attachment_name: pendingAttachment ? pendingAttachment.file.name   : null,
      attachment_type: pendingAttachment
        ? (pendingAttachment.file.type.startsWith("image/") ? "image" : "file")
        : null,
      is_read: false,
      created_at: new Date().toISOString(),
      _pending: true
    }

    setMessagesMap((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), optimisticMsg]
    }))

    // Spremimo lokalne kopije prije čišćenja state-a (potrebno za rollback)
    const draftBackup       = text
    const attachmentBackup  = pendingAttachment

    setDraft("")
    setPendingAttachment(null)

    try {
      // 1) Upload (ako ima privitak) - server vraća URL i meta podatke
      let attachmentMeta = null
      if (attachmentBackup) {
        // Privremeno koristimo backup u uploadAttachment-u jer smo state već očistili
        const fd = new FormData()
        fd.append("file", attachmentBackup.file)
        fd.append("user_id", String(currentUser.id))
        const upRes = await fetch(UPLOAD_URL, { method: "POST", body: fd })
        const upData = await upRes.json()
        if (!upRes.ok || !upData.success) {
          throw new Error(upData.message || `Upload failed (HTTP ${upRes.status})`)
        }
        attachmentMeta = {
          attachment_url:  upData.attachment_url,
          attachment_name: upData.attachment_name,
          attachment_type: upData.attachment_type
        }
      }

      // 2) Insert poruke
      const payload = {
        sender_id: currentUser.id,
        recipient_id: activeId,
        content: text
      }
      if (attachmentMeta) Object.assign(payload, attachmentMeta)

      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || `HTTP ${res.status}`)
      }

      // Zamijeni optimisticku poruku verzijom iz baze
      setMessagesMap((prev) => {
        const list = prev[activeId] || []
        return { ...prev, [activeId]: list.map((m) => (m.id === tempId ? data.message : m)) }
      })

      // Otpusti privremeni blob URL ako je postojao
      if (attachmentBackup?.previewUrl) {
        URL.revokeObjectURL(attachmentBackup.previewUrl)
      }

      // Osvjeziti listu kontakata radi preview-a zadnje poruke
      fetchContacts(true)
    } catch (err) {
      console.error("Failed to send message:", err)
      setSendError(err.message || "Failed to send message")

      // Rollback - ukloni optimistic msg, vrati draft i privitak
      setMessagesMap((prev) => {
        const list = prev[activeId] || []
        return { ...prev, [activeId]: list.filter((m) => m.id !== tempId) }
      })
      setDraft(draftBackup)
      setPendingAttachment(attachmentBackup)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleContactClick = (id) => {
    setActiveId(id)
    setShowSidebarOnMobile(false)
    setMessagesError(null)
    setShowEmojiPicker(false)
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
    )
  }

  // =====================================================================
  // Loader dok ne učitamo trenutnog korisnika
  // =====================================================================
  if (currentUser === null) {
    return (
      <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  const hasSearch = search.trim().length > 0

  return (
    // h-screen + overflow-hidden: cijela stranica lockna na visinu prozora,
    // skrola se samo područje s porukama unutar chata.
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-4 md:px-12 py-4 md:py-6 flex flex-col">

        <div className="mb-4 md:mb-6 border-b border-slate-200 pb-4 md:pb-5 shrink-0">
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

        {/* Card popunjava ostatak prostora ispod naslova - flex-1 + min-h-0
            kako bi child grid mogao biti h-full bez overflow-a glavnog containera. */}
        <Card className="border-none shadow-xl bg-white overflow-hidden p-0 flex-1 min-h-0">
          {/* h-full + min-h-0 na grid containeru kako bi grid items
              (aside + section) bili prisiljeni respektirati visinu parent-a
              umjesto da rastu prema sadržaju (default min-height: auto). */}
          <div className="grid md:grid-cols-[340px_1fr] h-full min-h-0">

            {/* =================================================== */}
            {/* SIDEBAR                                              */}
            {/* =================================================== */}
            <aside
              className={`border-r border-slate-100 flex-col min-h-0 overflow-hidden ${
                showSidebarOnMobile ? "flex" : "hidden md:flex"
              }`}
            >
              {/* Search bar */}
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search to start a new chat..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white h-10"
                  />
                </div>
                {hasSearch && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <UserPlus className="h-3 w-3" />
                    Showing all matching users
                  </div>
                )}
              </div>

              {/* Lista kontakata - uvijek vidljiv styled scrollbar */}
              <div className="flex-1 overflow-y-scroll [scrollbar-width:auto] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:min-h-[40px]">
                {loadingContacts ? (
                  <div className="p-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm">Loading contacts...</span>
                  </div>
                ) : contactsError ? (
                  <div className="p-6 flex flex-col items-center text-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                    <p className="text-sm text-slate-600">{contactsError}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchContacts(false)} className="gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    {hasSearch ? (
                      "No users match your search."
                    ) : (
                      <>
                        No conversations yet.
                        <br />
                        <span className="text-xs">Use the search above to find someone and say hi.</span>
                      </>
                    )}
                  </div>
                ) : (
                  filteredContacts.map((contact) => {
                    const isActive = contact.id === activeId
                    // U pretrazi može biti i osoba bez razgovora - prikaži je drugačije
                    const isNewContact = hasSearch && !contact.has_conversation
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
                        <div className="relative shrink-0">
                          <Avatar className="h-12 w-12">
                            {contact.avatar_url && (
                              <AvatarImage src={contact.avatar_url} alt={contact.username} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {getInitials(contact.username)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 truncate">
                              {contact.username}
                            </span>
                            <span className="text-xs text-slate-400 shrink-0">
                              {formatSidebarTime(contact.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-xs text-slate-500 truncate">
                              {isNewContact ? (
                                <span className="italic text-primary/80">
                                  Click to start a new chat
                                </span>
                              ) : contact.last_message ? (
                                contact.last_message
                              ) : (
                                <span className="italic text-slate-400">No messages yet</span>
                              )}
                            </span>
                            {contact.unread_count > 0 && (
                              <span className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                {contact.unread_count}
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
            {/* CHAT PROZOR                                          */}
            {/* =================================================== */}
            <section
              className={`flex-col bg-slate-50/50 min-h-0 overflow-hidden ${
                showSidebarOnMobile ? "hidden md:flex" : "flex"
              }`}
            >
              {activeContact ? (
                <>
                  {/* Header chata */}
                  <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white">
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
                        {activeContact.avatar_url && (
                          <AvatarImage src={activeContact.avatar_url} alt={activeContact.username} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(activeContact.username)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {activeContact.username}
                      </div>
                      <div className="text-xs text-slate-500">
                        {activeContact.role}
                        {activeContact.points > 0 && <> · {activeContact.points} pts</>}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-500 hover:text-primary"
                      onClick={() => fetchMessages(activeId, false)}
                      title="Refresh messages"
                      aria-label="Refresh messages"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Message area */}
                  <div
                    ref={scrollAreaRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-scroll p-4 md:p-6 space-y-3 [scrollbar-width:auto] [scrollbar-color:rgb(100_116_139)_rgb(241_245_249)] [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-slate-100 [&::-webkit-scrollbar-thumb]:min-h-[40px]"
                  >
                    {loadingMessages && activeMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Loading messages...</span>
                      </div>
                    ) : messagesError ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        <p className="text-sm text-slate-600">{messagesError}</p>
                        <Button variant="outline" size="sm" onClick={() => fetchMessages(activeId, false)} className="gap-2">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Retry
                        </Button>
                      </div>
                    ) : activeMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                        <MessageSquare className="h-10 w-10 mb-2" />
                        <p className="text-sm">No messages yet. Send the first one!</p>
                      </div>
                    ) : (
                      activeMessages.map((msg) => {
                        const isSent = msg.type === "sent" ||
                          (currentUser && msg.sender_id === currentUser.id)
                        const attUrl = resolveAttachmentUrl(msg.attachment_url)
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 shadow-sm ${
                                isSent
                                  ? `bg-primary text-primary-foreground rounded-br-sm ${msg._pending ? "opacity-70" : ""}`
                                  : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                              }`}
                            >
                              {/* Renderiranje privitka iznad teksta */}
                              {msg.attachment_url && msg.attachment_type === "image" && (
                                <a
                                  href={attUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mb-2"
                                >
                                  <img
                                    src={attUrl}
                                    alt={msg.attachment_name || "image"}
                                    className="max-h-64 rounded-lg object-cover"
                                  />
                                </a>
                              )}

                              {msg.attachment_url && msg.attachment_type !== "image" && (
                                <a
                                  href={attUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msg.attachment_name || true}
                                  className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                                    isSent
                                      ? "bg-white/15 hover:bg-white/25 text-primary-foreground"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  <FileText className="h-4 w-4 shrink-0" />
                                  <span className="truncate flex-1 min-w-0">
                                    {msg.attachment_name || "attachment"}
                                  </span>
                                  <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                </a>
                              )}

                              {msg.content && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                              )}

                              <div
                                className={`flex items-center gap-1 mt-1 text-[10px] ${
                                  isSent ? "text-primary-foreground/70 justify-end" : "text-slate-400"
                                }`}
                              >
                                <span>{formatMessageTime(msg.created_at)}</span>
                                {isSent && (
                                  msg._pending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCheck className={`h-3 w-3 ${msg.is_read ? "text-blue-300" : ""}`} />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}

                    {/* "Sending..." bubble - isti wheel pattern kao u AI chatu.
                        Pojavljuje se na sent strani dok poruka ide na server,
                        kao vizualni feedback uz optimistic mjehurić iznad. */}
                    {sending && (
                      <div className="flex gap-3 justify-end">
                        <div className="bg-primary/90 text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 text-sm flex items-center gap-2 shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </div>
                        <div className="p-2 h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <Avatar className="h-9 w-9">
                            {currentUser?.avatar_url && (
                              <AvatarImage src={currentUser.avatar_url} alt={currentUser.username} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {getInitials(currentUser?.username)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="border-t border-slate-100 bg-white p-3 md:p-4 relative">
                    {sendError && (
                      <div className="mb-2 px-3 py-2 rounded-md bg-red-50 border border-red-100 text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{sendError}</span>
                        <button
                          type="button"
                          onClick={() => setSendError(null)}
                          className="text-red-400 hover:text-red-600"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Preview privitka koji čeka slanje */}
                    {pendingAttachment && (
                      <div className="mb-2 flex items-center gap-3 px-3 py-2 rounded-md bg-slate-50 border border-slate-200">
                        {pendingAttachment.previewUrl ? (
                          <img
                            src={pendingAttachment.previewUrl}
                            alt="preview"
                            className="h-12 w-12 object-cover rounded"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-primary/10 text-primary flex items-center justify-center">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700 truncate">
                            {pendingAttachment.file.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatBytes(pendingAttachment.file.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearPendingAttachment}
                          disabled={sending}
                          className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-50"
                          aria-label="Remove attachment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Emoji picker panel - apsolutno pozicioniran iznad input-a */}
                    {showEmojiPicker && (
                      <div
                        ref={emojiPanelRef}
                        className="absolute bottom-[calc(100%-8px)] left-3 z-20 w-80 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl p-3"
                      >
                        {EMOJI_GROUPS.map((group) => (
                          <div key={group.name} className="mb-3 last:mb-0">
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                              {group.name}
                            </div>
                            <div className="grid grid-cols-8 gap-1">
                              {group.emojis.map((e, idx) => (
                                <button
                                  key={`${group.name}-${idx}`}
                                  type="button"
                                  onClick={() => insertEmoji(e)}
                                  className="h-8 w-8 text-lg hover:bg-slate-100 rounded transition-colors"
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={onFileSelected}
                      className="hidden"
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.log,.zip,.rar,.7z,.tar,.gz"
                    />

                    <div className="flex items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-slate-500 hover:text-primary"
                        aria-label="Attach file"
                        onClick={onFileButtonClick}
                        disabled={sending}
                        title="Attach a file"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>

                      <Button
                        ref={emojiButtonRef}
                        variant="ghost"
                        size="icon"
                        className={`h-11 w-11 shrink-0 ${
                          showEmojiPicker ? "text-primary bg-primary/10" : "text-slate-500 hover:text-primary"
                        }`}
                        aria-label="Emoji"
                        onClick={() => setShowEmojiPicker((v) => !v)}
                        disabled={sending}
                        title="Pick an emoji"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>

                      <Textarea
                        ref={textareaRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={pendingAttachment ? "Add a caption (optional)..." : "Type a message..."}
                        rows={1}
                        disabled={sending}
                        className="flex-1 bg-slate-50 border-slate-200 focus:bg-white min-h-[44px] max-h-[120px] resize-none py-3"
                      />

                      <Button
                        type="button"
                        size="lg"
                        onClick={sendMessage}
                        disabled={(!draft.trim() && !pendingAttachment) || sending}
                        className="h-11 px-5 gap-2 shadow-md shadow-primary/20 shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {sending ? "Sending..." : "Send"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageSquare className="h-16 w-16 text-slate-200 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-sm">
                    {contacts.some((c) => c.has_conversation)
                      ? "Choose a contact from the sidebar to start messaging."
                      : "Search for a user in the sidebar to start your first chat."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </Card>
      </main>
      {/* Footer namjerno izostavljen na chat ekranu - stranica je lockna na
          viewport pa ne bi imala mjesta. Footer je prisutan na svim ostalim
          stranicama gdje stranica može skrolat normalno. */}
    </div>
  )
}
