import { Header } from "../Components/Header"
import { Footer } from "../Components/Footer"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

// Import komponenti
import SearchBar from "./components/SearchBar"
import CategoryFilter from "./CategoryFilter"
import ChallengeList from "./ChallengeList"
import ChallengeModal from "./ChallengeModal"

export default function CTFPage() {
  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selectedChallenge, setSelectedChallenge] = useState(null)
  const [flagInput, setFlagInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
    loadCategories()
    loadChallenges()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/challenges/get_categories.php')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadChallenges = async () => {
    try {
      const userData = localStorage.getItem('user')
      const user = userData ? JSON.parse(userData) : null
      
      const url = user 
        ? `http://localhost/CyberEdu/Backend/challenges/get_challenges.php?user_id=${user.id}`
        : 'http://localhost/CyberEdu/Backend/challenges/get_challenges.php'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setChallenges(data.challenges)
      }
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
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

  const handleSubmitFlag = async () => {
    if (!flagInput.trim()) {
      setMessage("Unesite flag!")
      return
    }

    const userData = localStorage.getItem('user')
    if (!userData) {
      setMessage("Morate biti prijavljeni!")
      navigate('/login')
      return
    }

    const user = JSON.parse(userData)
    setSubmitting(true)
    setMessage("")

    try {
      const response = await fetch('http://localhost/CyberEdu/Backend/challenges/submit_flag.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          challenge_id: selectedChallenge.id,
          flag: flagInput
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`✅ ${data.message} +${data.points} points!`)
        setFlagInput("")
        loadChallenges() // Reload to update solved status
      } else {
        setMessage(`❌ ${data.message}`)
      }
    } catch (error) {
      console.error('Error submitting flag:', error)
      setMessage("❌ Greška pri slanju flag-a")
    } finally {
      setSubmitting(false)
    }
  }

  const handleAttemptChallenge = (challenge) => {
    setSelectedChallenge(challenge)
    setFlagInput("")
    setMessage("")
  }

  const handleCloseModal = () => {
    setSelectedChallenge(null)
    setFlagInput("")
    setMessage("")
  }

  const handleFlagChange = (e) => {
    setFlagInput(e.target.value)
  }

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId)
  }

  const filteredChallenges = challenges.filter(challenge => 
    activeCategory === "all" || challenge.category_id.toString() === activeCategory
  )

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-12 flex items-center justify-center">
          <div className="text-center">Učitavanje challengea...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">CTF Challenges</h1>
          <p className="text-lg text-muted-foreground">
            Solve challenges, capture flags, and earn points to climb the leaderboard.
          </p>
        </div>

        <SearchBar />

        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        <ChallengeList
          challenges={challenges}
          filteredChallenges={filteredChallenges}
          activeCategory={activeCategory}
          onAttemptChallenge={handleAttemptChallenge}
          getDifficultyColor={getDifficultyColor}
        />

        {/* Challenge Modal */}
        {selectedChallenge && (
          <ChallengeModal
            challenge={selectedChallenge}
            onClose={handleCloseModal}
            flagInput={flagInput}
            onFlagChange={handleFlagChange}
            onSubmitFlag={handleSubmitFlag}
            submitting={submitting}
            message={message}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}