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
      // Set avatar preview
      if (userData.avatar_url) {
        const avatarUrl = userData.avatar_url.startsWith('http') 
          ? userData.avatar_url 
          : `http://localhost/CyberEdu/Backend/${userData.avatar_url}`
        setAvatarPreview(avatarUrl)
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
        setError("Image is too large. Maximum size is 2MB.")
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError("Please select an image (JPEG, PNG, GIF).")
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
    
    if (formData.new_password) {
      if (formData.new_password.length < 6) {
        setError("New password must have at least 6 characters.")
        return false
      }
      
      if (formData.new_password !== formData.confirm_password) {
        setError("New password and confirmation do not match.")
        return false
      }
      
      if (!formData.current_password) {
        setError("Please enter your current password to change password.")
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess("Profile updated successfully!")
        
        // Update local storage with new avatar URL
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        const updatedUser = {
          ...currentUser,
          id: userData.id,
          username: formData.username,
          email: formData.email,
          avatar_url: data.avatar_url || currentUser.avatar_url,
          profile_image: data.avatar_url || currentUser.profile_image // Ensure both fields are updated
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // Call the onUpdate callback to refresh profile data
        if (onUpdate) {
          await onUpdate() // Wait for profile data to refresh
        }
        
        setTimeout(() => {
          onClose()
          // Force page reload to update leaderboard
          window.location.reload()
        }, 1500)
      } else {
        setError(data.message || "Error updating profile.")
      }
    } catch (error) {
      console.error("Error details:", error)
      setError(`Connection error: ${error.message}. Please check if backend is available.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Change your profile information. Click save when you're done.
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
                Click the camera to change profile picture (max 2MB)
              </p>
            </div>
            
            {/* Form Fields */}
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
                <h4 className="text-sm font-medium mb-3">Change Password</h4>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
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
                <Label htmlFor="new_password">New Password</Label>
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
                <Label htmlFor="confirm_password">Confirm New Password</Label>
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