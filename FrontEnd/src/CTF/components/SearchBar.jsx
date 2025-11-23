import { Button } from "../../Components/ui/button"
import { Input } from "../../Components/ui/input"
import { Search, Filter } from "lucide-react"

export default function SearchBar() {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search challenges..." className="pl-9" />
      </div>
      <Button variant="outline">
        <Filter className="mr-2 h-4 w-4" />
        Filter
      </Button>
    </div>
  )
}