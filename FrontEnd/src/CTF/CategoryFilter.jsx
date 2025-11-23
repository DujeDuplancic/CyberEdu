export default function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onCategoryChange("all")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeCategory === "all" 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id.toString())}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeCategory === category.id.toString()
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}