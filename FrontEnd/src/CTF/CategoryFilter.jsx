"use client"

import { Button } from "../Components/ui/button"
import { LayoutGrid, Hash } from "lucide-react"

/**
 * CategoryFilter Component
 * Provides a clean, vertical navigation for filtering challenges by domain.
 * Styles are inspired by the sidebar navigation seen in modern dashboards.
 */
export default function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
    return (
        <div className="flex flex-col gap-1">
            {/* "All Categories" Toggle Button */}
            <Button
                variant={activeCategory === "all" ? "default" : "ghost"}
                onClick={() => onCategoryChange("all")}
                className={`w-full justify-start gap-3 h-11 px-4 rounded-lg transition-all duration-200 ${
                    activeCategory === "all" 
                        ? "bg-[#4461f2] text-white shadow-md shadow-blue-100 hover:bg-[#3b55d1]" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-[#4461f2]"
                }`}
            >
                <LayoutGrid className={`h-4 w-4 ${activeCategory === "all" ? "text-white" : "text-slate-400"}`} />
                <span className="font-bold text-sm">All Domains</span>
            </Button>

            {/* Separator line for visual hierarchy */}
            <div className="my-2 h-px bg-slate-100 mx-2" />

            {/* Dynamic Category Buttons */}
            {categories.map((category) => {
                const isActive = activeCategory === category.id.toString();
                
                return (
                    <Button
                        key={category.id}
                        variant={isActive ? "default" : "ghost"}
                        onClick={() => onCategoryChange(category.id.toString())}
                        className={`w-full justify-start gap-3 h-11 px-4 rounded-lg transition-all duration-200 ${
                            isActive 
                                ? "bg-[#4461f2] text-white shadow-md shadow-blue-100 hover:bg-[#3b55d1]" 
                                : "text-slate-600 hover:bg-slate-50 hover:text-[#4461f2]"
                        }`}
                    >
                        {/* Technical icon for categories */}
                        <Hash className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-300"}`} />
                        <span className="font-bold text-sm">{category.name}</span>
                    </Button>
                );
            })}
        </div>
    )
}