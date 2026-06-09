import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../Components/ui/dialog"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Label } from "../Components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "../Components/ui/avatar"
import { Camera, Loader2, X, User, Lock, ImageIcon, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "../Components/ui/alert"

// =====================================================================
// Tri moguće akcije u modalu - korisnik bira što želi promijeniti.
// Svaka akcija ima ikonu, naziv i opis koji se renderira kao chip gore.
// =====================================================================
const ACTIONS = [
  { key: "info",     label: "Account info", icon: User,      desc: "Change username or email" },
  { key: "password", label: "Password",     icon: Lock,      desc: "Set a new password" },
  { key: "avatar",   label: "Avatar",       icon: ImageIcon, desc: "Upload or remove profile picture" }
]

export function EditProfileModal({ isOpen, onClose, userData, onUpdate }) {
  // Trenutno odabrana akcija - default "info" jer je najčešće korištena
  const [action, setAction] = useState("info")

  // Stanja polja - sva su međusobno neovisna i ne resetiraju se pri promjeni akcije
  // (korisnik može pripremiti više polja, ali se šalje SAMO ono što odgovara akciji)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    current_password: "",
    new_password: "",
    confirm_password: ""
  })

  // Avatar stanja - lokalni file + preview URL + flag za eksplicitno brisanje
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [removeAvatar, setRemoveAvatar] = useState(false)

  // UI stanja
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [success, setSuccess] = useState("")

  // =====================================================================
  // Inicijalizacija polja iz userData kad se modal otvori.
  // Email često ne dolazi iz get_profile.php pa fallback čitamo iz localStorage-a.
  // =====================================================================
  useEffect(() => {
    if (userData && isOpen) {
      // Defensive fallback - dohvaćamo dodatne podatke iz localStorage-a
      let storedUser = {}
      try {
        storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      } catch (e) { /* ignoriramo - storedUser ostaje prazan objekt */ }

      setFormData({
        username: userData.username || storedUser.username || "",
        email:    userData.email    || storedUser.email    || "",
        current_password: "",
        new_password: "",
        confirm_password: ""
      })

      // Trenutna profilna - apsolutni URL za prikaz
      if (userData.avatar_url) {
        const url = userData.avatar_url.startsWith('http')
          ? userData.avatar_url
          : `http://localhost/CyberEdu/Backend/${userData.avatar_url}`
        setAvatarPreview(url)
      } else {
        setAvatarPreview("")
      }

      setAvatarFile(null)
      setRemoveAvatar(false)
      setAction("info")
      setError("")
      setSuccess("")
    }
  }, [userData, isOpen])

  // =====================================================================
  // Handler-i za pojedinačne unose - svaki čisti error/success poruke
  // =====================================================================
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError("Image is too large. Maximum size is 2MB.")
      return
    }
    if (!file.type.startsWith('image/')) {
      setError("Please select an image (JPEG, PNG, GIF, WEBP).")
      return
    }

    setAvatarFile(file)
    setRemoveAvatar(false) // ako je korisnik prije kliknuo remove, sada to poništavamo
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
    setError("")
  }

  /**
   * Klik na "Remove avatar" - lokalno označavamo namjeru brisanja,
   * a stvarni delete se izvršava tek pri submit-u (šalje se remove_avatar=1).
   */
  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview("")
    setRemoveAvatar(true)
    setError("")
  }

  // =====================================================================
  // Validacija - validiramo SAMO polja relevantna za odabranu akciju
  // =====================================================================
  const validateForAction = () => {
    if (action === "info") {
      if (formData.username.length < 3) {
        setError("Username must have at least 3 characters.")
        return false
      }
      if (formData.username.length > 50) {
        setError("Username is too long (maximum 50 characters).")
        return false
      }
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError("Please enter a valid email address.")
        return false
      }
      // Ako su username i email isti kao trenutni, nema što mijenjati
      if (formData.username === (userData?.username || "") &&
          formData.email    === (userData?.email    || "")) {
        setError("No changes to save.")
        return false
      }
      return true
    }

    if (action === "password") {
      if (!formData.current_password) {
        setError("Please enter your current password.")
        return false
      }
      if (!formData.new_password || formData.new_password.length < 6) {
        setError("New password must be at least 6 characters long.")
        return false
      }
      if (formData.new_password !== formData.confirm_password) {
        setError("New password and confirmation do not match.")
        return false
      }
      return true
    }

    if (action === "avatar") {
      if (!avatarFile && !removeAvatar) {
        setError("Pick an image to upload or click 'Remove' to delete the current avatar.")
        return false
      }
      return true
    }

    return false
  }

  // =====================================================================
  // Submit - šalje SAMO podatke vezane za aktivnu akciju
  // =====================================================================
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForAction()) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Resolve user_id - prvenstveno iz userData, fallback na localStorage.
      // Bez ovoga je dolazilo do "User not found" jer get_profile.php nije
      // vraćao id pa je userData.id bilo undefined.
      let resolvedUserId = userData?.id
      if (!resolvedUserId) {
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}')
          resolvedUserId = stored.id
        } catch (e) { /* nije kritično */ }
      }

      if (!resolvedUserId) {
        setError("Could not identify your account. Please log out and back in.")
        setLoading(false)
        return
      }

      const submitData = new FormData()
      submitData.append("user_id", resolvedUserId)

      if (action === "info") {
        submitData.append("username", formData.username)
        submitData.append("email", formData.email)
      } else if (action === "password") {
        submitData.append("current_password", formData.current_password)
        submitData.append("new_password", formData.new_password)
      } else if (action === "avatar") {
        if (avatarFile) {
          submitData.append("avatar", avatarFile)
        } else if (removeAvatar) {
          submitData.append("remove_avatar", "1")
        }
      }

      const response = await fetch("http://localhost/CyberEdu/Backend/profile/update_profile.php", {
        method: "POST",
        body: submitData,
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "Error updating profile.")
        return
      }

      setSuccess(data.message || "Profile updated successfully!")

      // Spajamo aktualne podatke iz backend-a s onima u localStorage-u
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const merged = {
        ...currentUser,
        ...(data.user || {}),
        // Ako je backend vratio explicit avatar_url (uključujući null) - poštujemo to
        avatar_url: data.user ? data.user.avatar_url : (data.avatar_url ?? currentUser.avatar_url)
      }
      localStorage.setItem('user', JSON.stringify(merged))

      // Refresh profila u parent komponenti (ako je proslijeđen callback)
      if (onUpdate) {
        await onUpdate()
      }

      // Kratka pauza da korisnik vidi success poruku, pa zatvaramo modal
      setTimeout(() => {
        onClose()
        // Reload samo ako se mijenjao username (jer ga prikazuje leaderboard)
        // ili avatar (jer ga prikazuju razne kartice). Za password promjene
        // nije potreban reload pa ostajemo na stranici.
        if (action === "info" || action === "avatar") {
          window.location.reload()
        }
      }, 1200)

    } catch (err) {
      console.error("Error details:", err)
      setError(`Connection error: ${err.message}. Please check if backend is available.`)
    } finally {
      setLoading(false)
    }
  }

  // Inicijali za fallback unutar avatara
  const initials = (formData.username || userData?.username || "U")
    .substring(0, 2)
    .toUpperCase()

  // Tekst gumba ovisi o akciji - daje korisniku konkretan feedback što radi
  const submitLabel = action === "info"
    ? "Save info"
    : action === "password"
      ? "Update password"
      : (removeAvatar ? "Remove avatar" : "Save avatar")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Pick what you want to change. You only update the section you select.
            </DialogDescription>
          </DialogHeader>

          {/* Segmented action picker - 3 chip-a, jedan je aktivan */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {ACTIONS.map((a) => {
              const Icon = a.icon
              const isActive = action === a.key
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => { setAction(a.key); setError(""); setSuccess("") }}
                  disabled={loading}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {a.label}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-slate-400 text-center mt-2">
            {ACTIONS.find(a => a.key === action)?.desc}
          </p>

          <div className="space-y-4 py-5">

            {/* =====================  AKCIJA: INFO  ===================== */}
            {action === "info" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* =====================  AKCIJA: PASSWORD  ===================== */}
            {action === "password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current password</Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    placeholder="Enter current password"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    placeholder="At least 6 characters"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm new password</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    placeholder="Repeat new password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </>
            )}

            {/* =====================  AKCIJA: AVATAR  ===================== */}
            {action === "avatar" && (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative group">
                  <Avatar className="h-28 w-28 ring-4 ring-primary/10">
                    <AvatarImage src={avatarPreview || "/placeholder.svg?height=112&width=112"} />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={loading}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={loading}
                  >
                    <Camera className="h-3.5 w-3.5 mr-1.5" />
                    Choose image
                  </Button>
                  {/* Remove gumb prikazujemo samo ako uopće postoji nešto za maknuti */}
                  {(avatarPreview || userData?.avatar_url) && !removeAvatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={loading}
                      className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Status indikator kad je odabrano brisanje */}
                {removeAvatar && (
                  <div className="text-xs text-destructive font-medium flex items-center gap-1.5">
                    <X className="h-3 w-3" />
                    Avatar will be removed on save
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  JPEG, PNG, GIF or WEBP. Max 2MB. Square crops look best.
                </p>
              </div>
            )}

            {/* =====================  PORUKE GREŠKE / USPJEHA  ===================== */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
