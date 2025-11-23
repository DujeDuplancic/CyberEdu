import ChallengeCard from "./components/ChallengeCard"

export default function ChallengeList({ 
  challenges, 
  filteredChallenges, 
  activeCategory, 
  onAttemptChallenge,
  getDifficultyColor 
}) {
  if (filteredChallenges.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {activeCategory === "all" 
            ? "No challenges available." 
            : "No challenges found in this category."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredChallenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          onAttempt={onAttemptChallenge}
          getDifficultyColor={getDifficultyColor}
        />
      ))}
    </div>
  )
}