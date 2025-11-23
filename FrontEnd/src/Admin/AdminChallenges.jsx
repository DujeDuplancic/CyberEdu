import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Plus, Edit, Trash2 } from "lucide-react"
import CreateChallengeForm from "./components/CreateChallengeForm"
import EditChallengeForm from "./components/EditChallengeForm"

export default function AdminChallenges({ 
  challenges, 
  categories, 
  onRefresh, 
  onDeleteChallenge,
  onCreateChallenge,
  onUpdateChallenge,
  onFileUpload  // DODAJ OVO
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState(null)

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Challenge Management</CardTitle>
              <CardDescription>Create and manage CTF challenges</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onRefresh}>
                Refresh
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Challenge
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{challenge.title}</p>
                      <span className={`px-2 py-1 text-xs rounded-md ${
                        challenge.difficulty === 'Easy' ? 'bg-green-500 text-white' :
                        challenge.difficulty === 'Medium' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {challenge.difficulty}
                      </span>
                      {challenge.file_url && (
                        <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md">
                          Has File
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.category_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {challenge.points} points • {challenge.solves_count} solves
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(challenge)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDeleteChallenge(challenge.id, challenge.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No challenges created yet. Create your first challenge!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Challenge Modal */}
      {showCreateForm && (
        <CreateChallengeForm
          categories={categories}
          onSubmit={onCreateChallenge}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Challenge Modal */}
      {showEditForm && editingChallenge && (
        <EditChallengeForm
          challenge={editingChallenge}
          categories={categories}
          onSubmit={onUpdateChallenge}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleUpdateSuccess}
          onFileUpload={onFileUpload}  // DODAJ OVO
        />
      )}
    </div>
  )
}