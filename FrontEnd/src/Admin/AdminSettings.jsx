import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../Components/ui/card"

export default function AdminSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Settings</CardTitle>
        <CardDescription>Configure platform-wide settings and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Settings interface coming soon...</p>
      </CardContent>
    </Card>
  )
}