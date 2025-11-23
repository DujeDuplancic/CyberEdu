import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../Components/ui/card"
import { Badge } from "../../Components/ui/badge"
import { Button } from "../../Components/ui/button"
import { CheckCircle } from "lucide-react"

export default function ChallengeCard({ challenge, onAttempt, getDifficultyColor }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{challenge.title}</CardTitle>
              {challenge.solved && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <CardDescription>{challenge.category_name}</CardDescription>
          </div>
          <Badge className={getDifficultyColor(challenge.difficulty)} variant="outline">
            {challenge.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span className="font-mono font-semibold text-primary">{challenge.points} pts</span>
            <span>{challenge.solves_count} solves</span>
          </div>
          <Button 
            onClick={() => onAttempt(challenge)}
            disabled={challenge.solved}
          >
            {challenge.solved ? "Solved" : "Attempt Challenge"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}