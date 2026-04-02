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
import { Camera, Loader2, X } from "lucide-react"
import { Alert, AlertDescription } from "../Components/ui/alert"

export function EditProfileModal({ isOpen, onClose, userData, onUpdate }) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    current_password: "",
    new_password: "",
    confirm_password: ""
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (userData && isOpen) {
      setFormData({
        username: userData.username || "",
        email: userData.email || "",
        current_password: "",
        new_password: "",
        confirm_password: ""
      })
      // Postavi avatar preview
      if (userData.avatar_url) {
        setAvatarPreview(`http://localhost/CyberEdu/Backend/${userData.avatar_url}`)
      } else {
        setAvatarPreview("")
      }
      setAvatarFile(null)
      setError("")
      setSuccess("")
    }
  }, [userData, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Slika je prevelika. Maksimalna veličina je 2MB.")
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError("Molimo odaberite sliku (JPEG, PNG, GIF).")
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview("")
  }

  const validateForm = () => {
    if (formData.username.length < 3) {
      setError("Korisničko ime mora imati najmanje 3 karaktera.")
      return false
    }
    
    if (formData.username.length > 50) {
      setError("Korisničko ime je predugo (maksimalno 50 karaktera).")
      return false
    }
    
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError("Molimo unesite ispravnu email adresu.")
      return false
    }
    
    if (formData.new_password) {
      if (formData.new_password.length < 6) {
        setError("Nova lozinka mora imati najmanje 6 karaktera.")
        return false
      }
      
      if (formData.new_password !== formData.confirm_password) {
        setError("Nova lozinka i potvrda lozinke se ne podudaraju.")
        return false
      }
      
      if (!formData.current_password) {
        setError("Molimo unesite trenutnu lozinku za promjenu lozinke.")
        return false
      }
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError("")
    setSuccess("")
    
    try {
      const submitData = new FormData()
      submitData.append("user_id", userData.id)
      submitData.append("username", formData.username)
      submitData.append("email", formData.email)
      
      if (formData.current_password) {
        submitData.append("current_password", formData.current_password)
      }
      
      if (formData.new_password) {
        submitData.append("new_password", formData.new_password)
      }
      
      if (avatarFile) {
        submitData.append("avatar", avatarFile)
      }
      
      // Log za debugging
      console.log("Sending request to:", "http://localhost/CyberEdu/Backend/profile/update_profile.php")
      console.log("User ID:", userData.id)
      console.log("Username:", formData.username)
      console.log("Email:", formData.email)
      
      const response = await fetch("http://localhost/CyberEdu/Backend/profile/update_profile.php", {
        method: "POST",
        body: submitData,
        credentials: "include"
      })
      
      console.log("Response status:", response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log("Response data:", data)
      
      if (data.success) {
        setSuccess("Profil je uspješno ažuriran!")
        
        // Update local storage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        const updatedUser = {
          ...currentUser,
          username: formData.username,
          email: formData.email,
          avatar_url: data.avatar_url || currentUser.avatar_url
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        if (onUpdate) {
          onUpdate(updatedUser)
        }
        
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(data.message || "Greška pri ažuriranju profila.")
      }
    } catch (error) {
      console.error("Error details:", error)
      setError(`Greška pri povezivanju sa serverom: ${error.message}. Provjerite da li je backend dostupan.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Uredi profil</DialogTitle>
            <DialogDescription>
              Promijenite svoje podatke profila. Kliknite sačuvaj kada završite.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback className="text-2xl">
                    {formData.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
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
                
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors shadow-md"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Kliknite na kameru za promjenu slike (max 2MB)
              </p>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-2">
              <Label htmlFor="username">Korisničko ime</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Unesite korisničko ime"
                disabled={loading}
                required
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
                placeholder="Unesite email adresu"
                disabled={loading}
                required
              />
            </div>
            
            {/* Password Change Section */}
            <div className="space-y-3 pt-2">
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-3">Promjena lozinke</h4>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current_password">Trenutna lozinka</Label>
                <Input
                  id="current_password"
                  name="current_password"
                  type="password"
                  value={formData.current_password}
                  onChange={handleInputChange}
                  placeholder="Unesite trenutnu lozinku"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_password">Nova lozinka</Label>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  placeholder="Unesite novu lozinku"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Potvrdite novu lozinku</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  placeholder="Potvrdite novu lozinku"
                  disabled={loading}
                />
              </div>
            </div>
            
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
              Odustani
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sačuvaj promjene
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}