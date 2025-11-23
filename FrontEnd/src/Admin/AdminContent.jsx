import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"
import { Button } from "../Components/ui/button"
import { Plus } from "lucide-react"

export default function AdminContent() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Manage lectures, wiki articles, and educational content</CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Content management interface coming soon...</p>
      </CardContent>
    </Card>
  )
}