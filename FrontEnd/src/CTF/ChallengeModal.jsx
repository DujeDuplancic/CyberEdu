import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Badge } from "../Components/ui/badge"
import { Download, File, CheckCircle, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useNotifications } from '../contexts/NotificationContext'
import { api } from '../lib/api'

export default function ChallengeModal({ 
  challenge, 
  onClose, 
  onSolve, // OVO JE KLJUČNO - callback za ažuriranje parent komponente
  isSolved = false // DODAJ OVO - da zna da li je već riješeno
}) {
  const [flag, setFlag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { showAchievement, showSuccess, showError } = useNotifications()

  const handleDownload = () => {
    if (!challenge.file_url) return
    
    const downloadUrl = `http://localhost/CyberEdu/BackEnd/challenges/download.php?file=${encodeURIComponent(challenge.file_url)}`
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }

  const handleViewFile = () => {
    if (challenge.file_url) {
      const viewUrl = `http://localhost${challenge.file_url}`
      window.open(viewUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!flag.trim()) {
      showError('Please enter a flag')
      return
    }

    // Ako je već riješeno, ne pokušavaj ponovno
    if (isSolved) {
      showError('You have already solved this challenge!')
      return
    }

    setSubmitting(true)

    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        showError('You must be logged in to submit flags')
        return
      }

      const user = JSON.parse(userData)
      
      const response = await api.post('/challenges/submit_flag.php', {
        user_id: user.id,
        challenge_id: challenge.id,
        flag: flag.trim()
      })

      if (response.success) {
        // Prikaži success notifikaciju
        showSuccess(`+${response.points} points earned!`, '🎉 Challenge Solved!')
        
        // Ako ima novih achievementa, prikaži ih
        if (response.new_achievements && response.new_achievements.length > 0) {
          response.new_achievements.forEach(achievement => {
            showAchievement({
              name: achievement.name,
              description: achievement.description,
              points_reward: achievement.points_reward || 0
            })
          })
        }
        
        // OVO JE KLJUČNO: Obavijesti parent komponentu da je challenge riješen
        if (onSolve) {
          onSolve(challenge.id, response.points)
        }
        
        // Reset input
        setFlag('')
        
        // Zatvori modal nakon uspješnog submita
        setTimeout(() => {
          onClose()
        }, 1500)
        
      } else {
        showError(response.message, '❌ Incorrect Flag')
      }
    } catch (error) {
      console.error('Submit error:', error)
      showError(error.message || 'Failed to submit flag', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Hard": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getFileName = () => {
    if (!challenge.file_url) return 'challenge_file'
    return challenge.file_url.split('/').pop()
  }

  const getFileExtension = () => {
    const fileName = getFileName()
    return fileName.split('.').pop()?.toLowerCase() || 'file'
  }

  const getFileIcon = () => {
    const ext = getFileExtension()
    const iconMap = {
      'txt': '📄',
      'zip': '📦', 
      'pdf': '📕',
      'jpg': '🖼️',
      'png': '🖼️',
      'exe': '⚙️'
    }
    return iconMap[ext] || '📎'
  }

  const canViewInBrowser = () => {
    const ext = getFileExtension()
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'html'].includes(ext)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{challenge.title}</h2>
              {isSolved && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Solved
                </Badge>
              )}
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              ✕
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 text-lg">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {challenge.description}
              </p>
            </div>
            
            {/* Challenge Info */}
            <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">Category:</span>
                <span className="text-blue-700">{challenge.category_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">Difficulty:</span>
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">Points:</span>
                <span className="font-mono text-blue-700 font-bold">{challenge.points}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-900">Solves:</span>
                <span className="text-blue-700">{challenge.solves_count || 0}</span>
              </div>
            </div>

            {/* FILE DOWNLOAD SECTION */}
            {challenge.file_url && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-lg flex items-center gap-2 text-gray-900">
                  <File className="h-5 w-5 text-blue-600" />
                  Challenge Files
                </h3>
                
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center h-12 w-12 bg-green-100 rounded-full text-2xl">
                        {getFileIcon()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 text-lg">
                          {getFileName()}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-green-700 mt-1">
                          <span className="bg-green-200 px-2 py-1 rounded text-xs font-medium">
                            {getFileExtension().toUpperCase()} File
                          </span>
                          <span>•</span>
                          <span>{(getFileExtension() === 'zip' || getFileExtension() === 'rar') ? 'Archive' : 'Ready to download'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleDownload}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transition-colors shadow-md"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download File
                    </Button>
                    
                    {canViewInBrowser() && (
                      <Button 
                        onClick={handleViewFile}
                        variant="outline"
                        className="flex-1 border-green-600 text-green-600 hover:bg-green-50 font-semibold py-3"
                        size="lg"
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        View File
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Flag Submission - SAMO ako nije već riješeno */}
            {!isSolved ? (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 text-lg text-gray-900">Submit Flag</h3>
                <div className="space-y-4">
                  <form onSubmit={handleSubmit} className="flex gap-3">
                    <Input
                      placeholder="Enter flag (format: CTF{...})"
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      className="flex-1 text-lg py-3 px-4 border-2 border-gray-300 focus:border-blue-500"
                      disabled={submitting}
                    />
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 text-lg transition-colors"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Flag"
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="border-t pt-6">
                <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Challenge Already Solved!</h3>
                      <p className="text-green-700 text-sm mt-1">
                        You've already earned {challenge.points} points for this challenge.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}