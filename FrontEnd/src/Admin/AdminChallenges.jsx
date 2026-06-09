import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import {
  Plus, Edit, Trash2, RefreshCw, Flag,
  Paperclip, Trophy, Target, Layers, Search
} from "lucide-react"
import CreateChallengeForm from "./components/CreateChallengeForm"
import EditChallengeForm from "./components/EditChallengeForm"
import AdminPagination from "./Components/AdminPagination"

// Broj izazova po stranici
const PAGE_SIZE = 8

// =====================================================================
// Mapa boja za difficulty - soft tonovi (bg-*-50 + text-*-700) konzistentno
// s ostatkom aplikacije (NewsPage filteri, Profile, itd.).
// =====================================================================
const DIFFICULTY_COLORS = {
  Easy:   "bg-emerald-50 text-emerald-700 border-emerald-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Hard:   "bg-rose-50 text-rose-700 border-rose-100"
}

export default function AdminChallenges({
  challenges,
  categories,
  onRefresh,
  onDeleteChallenge,
  onCreateChallenge,
  onUpdateChallenge,
  onFileUpload
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)

  // Lokalna pretraga + paginacija
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filtriranje po naslovu, kategoriji i difficulty-ju
  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return challenges
    return challenges.filter((c) =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.category_name || "").toLowerCase().includes(q) ||
      (c.difficulty || "").toLowerCase().includes(q)
    )
  }, [challenges, search])

  // Reset paginacije pri promjeni filtera/podataka
  useEffect(() => { setCurrentPage(1) }, [search, challenges.length])

  const totalPages = Math.max(1, Math.ceil(filteredChallenges.length / PAGE_SIZE))
  const visibleChallenges = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredChallenges.slice(start, start + PAGE_SIZE)
  }, [filteredChallenges, currentPage])

  const handleEdit = (challenge) => {
    setEditingChallenge(challenge)
    setShowEditForm(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    onRefresh()
  }

  const handleUpdateSuccess = () => {
    setShowEditForm(false)
    setEditingChallenge(null)
    onRefresh()
  }

  return (
    <div className="space-y-6">

      {/* Header sekcije s akcijama */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="pt-5 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Challenge Management</h2>
              <p className="text-sm text-slate-500">
                Create and manage CTF challenges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
              {challenges.length} total
            </span>
            <Button variant="outline" onClick={onRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              New challenge
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pretraga */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by title, category or difficulty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white border-slate-200 h-11"
        />
      </div>

      {/* Lista izazova */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-0">
          {filteredChallenges.length === 0 ? (
            // Empty state - dosljedan vizualni jezik s ostatkom app-a
            <div className="py-16 text-center px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Flag className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {search ? "No challenges match your search" : "No challenges yet"}
              </h3>
              <p className="text-slate-500 mt-1 mb-6">
                {search
                  ? "Try a different search term or clear the filter."
                  : "Create your first CTF challenge to populate the vault."}
              </p>
              {!search && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="gap-2 shadow-md shadow-primary/20"
                >
                  <Plus className="h-4 w-4" />
                  Create challenge
                </Button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visibleChallenges.map((challenge) => {
                const diffClass =
                  DIFFICULTY_COLORS[challenge.difficulty] ||
                  "bg-slate-50 text-slate-700 border-slate-200"

                return (
                  <li
                    key={challenge.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Lijevi blok: ikona + naslov + meta */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 bg-primary/10 rounded-lg text-primary shrink-0">
                        <Target className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-slate-900 truncate">{challenge.title}</p>

                          {/* Difficulty chip - soft style */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${diffClass}`}>
                            {challenge.difficulty}
                          </span>

                          {/* Indikator privitka */}
                          {challenge.file_url && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <Paperclip className="h-3 w-3" />
                              File
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Layers className="h-3.5 w-3.5" />
                          {challenge.category_name || "Uncategorized"}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {challenge.points} points
                          </span>
                          <span className="font-mono">
                            {challenge.solves_count} solves
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desni blok: akcije */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(challenge)}
                        className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteChallenge(challenge.id, challenge.title)}
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

      {/* Paginacija */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredChallenges.length}
        pageSize={PAGE_SIZE}
      />

      {/* Modali - funkcionalnost je apsolutno netaknuta */}
      {showCreateForm && (
        <CreateChallengeForm
          categories={categories}
          onSubmit={onCreateChallenge}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
          onFileUpload={onFileUpload}
        />
      )}

      {showEditForm && editingChallenge && (
        <EditChallengeForm
          challenge={editingChallenge}
          categories={categories}
          onSubmit={onUpdateChallenge}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleUpdateSuccess}
          onFileUpload={onFileUpload}
        />
      )}
    </div>
  )
}
