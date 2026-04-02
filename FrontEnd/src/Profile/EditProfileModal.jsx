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
import { Camera, Loader2 } from "lucide-react"
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
      setAvatarPreview(userData.avatar_url || "")
      setError("")
      setSuccess("")
    }
  }, [userData, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear errors when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Slika je prevelika. Maksimalna veličina je 2MB.")
        return
      }
      
      // Check file type
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
    }
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
      
      const response = await fetch("http://localhost/CyberEdu/Backend/profile/update_profile.php", {
        method: "POST",
        body: submitData,
        credentials: "include"
      })
      
      const data = await response.json()
      
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
        
        // Call onUpdate callback with updated data
        if (onUpdate) {
          onUpdate(updatedUser)
        }
        
        // Close modal after 1.5 seconds
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(data.message || "Greška pri ažuriranju profila.")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Greška pri povezivanju sa serverom.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Change your profile information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={avatarPreview || "/placeholder.svg?height=96&width=96"} />
                  <AvatarFallback className="text-2xl">
                    {formData.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
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
            </div>
            
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter username"
                disabled={loading}
                required
              />
            </div>
            
            {/* Email */}
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
                required
              />
            </div>
            
            {/* Password Change Section */}
            <div className="space-y-3 pt-2">
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-3">Change password</h4>
              </div>
              
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
                  placeholder="Enter new password"
                  disabled={loading}
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
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Error/Success Messages */}
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}