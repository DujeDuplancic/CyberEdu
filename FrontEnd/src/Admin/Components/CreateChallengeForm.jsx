import { useState, useRef } from "react"
import { Button } from "../../Components/ui/button"
import { Input } from "../../Components/ui/input"
import { Label } from "../../Components/ui/label"
import { Textarea } from "../../Components/ui/textarea"
import {
  X, Loader2, CheckCircle2, AlertTriangle, Plus,
  Flag, Trophy, Layers, Target as TargetIcon, FileText,
  Paperclip, Upload, Trash2, Save
} from "lucide-react"

/**
 * Modal forma za kreiranje novog CTF izazova.
 * Omogućuje admin-u da odmah pri kreiranju prikači file (handout/arhiva)
 * - file se uploada nakon uspješnog INSERT-a, koristeći vraćeni challenge_id.
 *
 * Props:
 *   categories    - lista kategorija za select
 *   onSubmit      - async fn(formData) -> response (uključuje challenge_id)
 *   onClose       - close modala
 *   onSuccess     - poziva se nakon potpunog uspjeha (create + opcionalni upload)
 *   onFileUpload  - async fn(file, challengeId) - upload file na server
 */
export default function CreateChallengeForm({ categories, onSubmit, onClose, onSuccess, onFileUpload }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: categories[0]?.id || "",
    difficulty: "Easy",
    points: 100,
    flag: ""
  })

  // Trenutni status forme i poruke
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState({ type: null, msg: "" }) // { type: 'success'|'error', msg }

  // Odabrani file (opcionalan) - sprema se lokalno do submit-a
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  // ===================================================================
  // Handler za promjene tekstualnih polja - jedan generic handler
  // ===================================================================
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? (parseInt(value) || 0) : value
    }))
  }

  // Handler za file picker - validira veličinu (50MB max prema upload_file.php)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      setStatus({ type: 'error', msg: 'File too large. Maximum size is 50MB.' })
      return
    }
    setSelectedFile(file)
    setStatus({ type: null, msg: "" })
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ===================================================================
  // Glavni submit handler - dvostupanjski proces:
  //   1) Stvori izazov (POST /admin/create_challenge.php)
  //   2) Ako postoji odabrani file, uploadaj ga s vraćenim challenge_id
  // ===================================================================
  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setStatus({ type: null, msg: "" })

    try {
      // 1. Kreiranje izazova - vraća objekt s challenge_id
      const result = await onSubmit(formData)
      const newChallengeId = result?.challenge_id || result?.id

      // 2. Ako je odabran file, uploadamo ga nakon uspješnog create-a
      if (selectedFile && newChallengeId && onFileUpload) {
        try {
          await onFileUpload(selectedFile, newChallengeId)
          setStatus({ type: 'success', msg: 'Challenge and file uploaded successfully!' })
        } catch (uploadErr) {
          // Izazov je kreiran ali upload nije uspio - obavještavamo korisnika
          setStatus({
            type: 'error',
            msg: `Challenge created, but file upload failed: ${uploadErr.message || 'unknown error'}`
          })
          // Ne zatvaramo modal automatski jer korisnik treba znati da file nije uploadan
          setTimeout(() => onSuccess(), 2500)
          return
        }
      } else {
        setStatus({ type: 'success', msg: 'Challenge created successfully!' })
      }

      setTimeout(() => onSuccess(), 1200)

    } catch (error) {
      setStatus({ type: 'error', msg: error.message || 'Failed to create challenge' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">

        {/* ==================  HEADER  ================== */}
        <div className="bg-gradient-to-br from-primary to-indigo-700 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Create New Challenge</h2>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-0.5">
                Fill in challenge details and optional handout
              </p>
            </div>
          </div>
        </div>

        {/* ==================  SADRŽAJ  ================== */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fcfdfe]">

          {/* Status poruke */}
          {status.msg && (
            <div className={`mb-5 flex items-start gap-3 p-3 rounded-xl border ${
              status.type === 'success'
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {status.type === 'success'
                ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                : <AlertTriangle className="h-5 w-5 shrink-0" />}
              <span className="text-sm font-medium">{status.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                <TargetIcon className="h-3.5 w-3.5" />
                Title
              </Label>
              <Input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. UserVault"
                className="h-11"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Mission briefing for the player. Include target URL if applicable."
                required
              />
            </div>

            {/* Grid: Category + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Layers className="h-3.5 w-3.5" />
                  Category
                </Label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Flag className="h-3.5 w-3.5" />
                  Difficulty
                </Label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Grid: Points + Flag */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Trophy className="h-3.5 w-3.5" />
                  Points
                </Label>
                <Input
                  id="points"
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flag" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <Flag className="h-3.5 w-3.5" />
                  Flag
                </Label>
                <Input
                  id="flag"
                  type="text"
                  name="flag"
                  value={formData.flag}
                  onChange={handleChange}
                  placeholder="CTF{your_flag_here}"
                  className="h-11 font-mono"
                  required
                />
              </div>
            </div>

            {/* ==========  FILE UPLOAD (NOVO)  ========== */}
            <div className="space-y-2 pt-2">
              <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                <Paperclip className="h-3.5 w-3.5" />
                Attachment <span className="text-slate-400 lowercase tracking-normal">(optional)</span>
              </Label>

              {/* Skriveni native input - aktivira se preko labela */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.pdf,.txt,.png,.jpg,.jpeg,.gif,.exe,.bin,.tar,.gz"
                onChange={handleFileChange}
                className="hidden"
                id="challenge-file-input"
              />

              {!selectedFile ? (
                // Drop-zone style picker
                <label
                  htmlFor="challenge-file-input"
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer text-center"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Add file</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ZIP, PDF, TXT, image, binary - up to 50MB
                    </p>
                  </div>
                </label>
              ) : (
                // Pregled odabranog file-a s opcijom uklanjanja
                <div className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-slate-700 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFile}
                    className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* ==========  FORM ACTIONS  ========== */}
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={creating}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="flex-1 h-11 gap-2 shadow-md shadow-primary/20"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {selectedFile ? "Creating & uploading..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create challenge
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
