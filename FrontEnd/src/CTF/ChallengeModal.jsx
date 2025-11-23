import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Badge } from "../Components/ui/badge"
import { Download } from "lucide-react"

export default function ChallengeModal({ 
  challenge, 
  onClose, 
  flagInput, 
  onFlagChange, 
  onSubmitFlag, 
  submitting, 
  message 
}) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "Hard": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{challenge.title}</h2>
            <Button variant="ghost" onClick={onClose}>✕</Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{challenge.description}</p>
            </div>
            
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-semibold">Category:</span> {challenge.category_name}
              </div>
              <div>
                <span className="font-semibold">Difficulty:</span> 
                <Badge className={`ml-2 ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Points:</span> {challenge.points}
              </div>
            </div>

            {/* File Download Section */}
            {challenge.file_url && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Challenge Files</h3>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {challenge.file_url.split('/').pop()}
                    </span>
                  </div>
                  <Button 
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <a 
                      href={`http://localhost${challenge.file_url}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Download the challenge files to get started!
                </p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Submit Flag</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter flag..."
                  value={flagInput}
                  onChange={onFlagChange}
                  onKeyPress={(e) => e.key === 'Enter' && onSubmitFlag()}
                />
                <Button 
                  onClick={onSubmitFlag} 
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
              {message && (
                <p className={`mt-2 text-sm ${
                  message.includes('✅') ? 'text-green-500' : 'text-red-500'
                }`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}