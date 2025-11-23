import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Shield, ShieldOff, Trash2 } from "lucide-react"

export default function AdminUsers({ users, onToggleAdmin, onDeleteUser, onRefresh }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage registered users and permissions</CardDescription>
            </div>
            <Button onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{user.username}</p>
                    {user.is_admin && (
                      <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-md">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()} • 
                    Points: {user.points} • 
                    Rank: #{user.rank}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onToggleAdmin(user.id, user.is_admin)}
                  >
                    {user.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    {user.is_admin ? ' Remove Admin' : ' Make Admin'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDeleteUser(user.id, user.username)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}