import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Input } from "../Components/ui/input"
import {
  Shield, ShieldOff, Trash2, RefreshCw, Users as UsersIcon,
  Trophy, Calendar, Mail, ShieldCheck, Search
} from "lucide-react"
import AdminPagination from "./Components/AdminPagination"

// Broj korisnika po stranici - usklađen s ostalim listama
const PAGE_SIZE = 8

// =====================================================================
// Helper koji generira inicijale iz korisničkog imena za AvatarFallback.
// =====================================================================
const getInitials = (name) => {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// Resolve avatar URL koji u bazi može biti relativan put (uploads/avatars/...)
const resolveAvatarUrl = (url) => {
  if (!url) return ""
  if (url.startsWith("http")) return url
  return `http://localhost/CyberEdu/Backend/${url}`
}

export default function AdminUsers({ users, onToggleAdmin, onDeleteUser, onRefresh }) {

  // Brojači za sumarni info chip iznad liste
  const adminCount   = users.filter((u) => !!u.is_admin).length
  const regularCount = users.length - adminCount

  // Pretraga i paginacija stanja - lokalna unutar ove komponente
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Memoizirano filtrirana lista (po username-u i email-u)
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    )
  }, [users, search])

  // Reset paginacije kad se promijeni pretraga ili dođe nova lista
  useEffect(() => {
    setCurrentPage(1)
  }, [search, users.length])

  // Klizimo na stranice na klijentskoj strani
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const visibleUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  return (
    <div className="space-y-6">

      {/* Header s naslovom sekcije i akcijama (refresh) */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="pt-5 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">User Management</h2>
              <p className="text-sm text-slate-500">
                Manage registered users and permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sumarni info chipovi */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              {adminCount} admins
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
              <UsersIcon className="h-3.5 w-3.5" />
              {regularCount} users
            </span>
            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search bar - pretraga po username-u i email-u */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-slate-200 h-11"
        />
      </div>

      {/* Lista korisnika */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">

          {/* Prazna lista - prikaz placeholder-a */}
          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <UsersIcon className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {search ? "No users match your search" : "No users found"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleUsers.map((user) => {
                const isAdmin = !!user.is_admin
                const avatarUrl = resolveAvatarUrl(user.avatar_url)

                return (
                  <li
                    key={user.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Lijevi blok: avatar + info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0 ring-2 ring-slate-100">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={user.username} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {getInitials(user.username)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-900 truncate">{user.username}</p>
                          {/* Soft badge za admina - uklapa se u paletu ostatka app-a */}
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {user.points} pts
                          </span>
                          <span className="font-mono">Rank #{user.rank}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desni blok: akcije */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleAdmin(user.id, user.is_admin)}
                        className={`gap-1.5 ${
                          isAdmin
                            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                            : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        }`}
                      >
                        {isAdmin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                        {isAdmin ? "Remove admin" : "Make admin"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteUser(user.id, user.username)}
                        className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Paginacija - prikazuje se samo kad ima više od jedne stranice */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredUsers.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}
