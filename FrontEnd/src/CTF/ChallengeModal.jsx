import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Badge } from "../Components/ui/badge"
import { Download, File, CheckCircle } from "lucide-react"

export default function ChallengeModal({ 
  challenge, 
  onClose, 
  flagInput, 
  onFlagChange, 
  onSubmitFlag, 
  submitting, 
  message 
}) {

  const handleDownload = () => {
    if (challenge.file_url) {
      const downloadUrl = `http://localhost${challenge.file_url}`;
      console.log("📥 Force downloading file:", downloadUrl);
      
      // Kreiraj privremeni link za download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getFileName(); // Ovo forsira download
      link.target = '_blank';
      
      // Simuliraj klik
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    if (!challenge.file_url) return 'challenge_file';
    return challenge.file_url.split('/').pop();
  }

  const getFileExtension = () => {
    const fileName = getFileName();
    return fileName.split('.').pop()?.toLowerCase() || 'file';
  }

  const getFileIcon = () => {
    const ext = getFileExtension();
    const iconMap = {
      'txt': '📄',
      'zip': '📦', 
      'pdf': '📕',
      'jpg': '🖼️',
      'png': '🖼️',
      'exe': '⚙️'
    };
    return iconMap[ext] || '📎';
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{challenge.title}</h2>
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
                  <div className="flex items-center justify-between">
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
                          <span>Ready to download</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleDownload}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download File
                    </Button>
                  </div>
                  
                  {/* Download Instructions */}
                  <div className="mt-3 p-3 bg-white border border-green-300 rounded text-sm">
                    <p className="text-green-800 font-medium mb-1">
                      💡 Download Tips:
                    </p>
                    <ul className="text-green-700 text-xs space-y-1">
                      <li>• Click "Download File" to save the file to your computer</li>
                      <li>• Right-click → "Save link as" for more options</li>
                      <li>• File will be saved as: <code className="bg-green-100 px-1 rounded">{getFileName()}</code></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Flag Submission */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4 text-lg text-gray-900">Submit Flag</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter flag (format: CTF{...})"
                    value={flagInput}
                    onChange={onFlagChange}
                    onKeyPress={(e) => e.key === 'Enter' && onSubmitFlag()}
                    className="flex-1 text-lg py-3 px-4 border-2 border-gray-300 focus:border-blue-500"
                  />
                  <Button 
                    onClick={onSubmitFlag} 
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
                </div>
                
                {message && (
                  <div className={`p-4 rounded-lg border-2 ${
                    message.includes('✅') 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.includes('✅') ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">!</span>
                        </div>
                      )}
                      <span className="font-medium">{message}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}