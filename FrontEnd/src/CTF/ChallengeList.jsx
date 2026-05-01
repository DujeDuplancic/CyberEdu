"use client"

import { useState, useMemo } from "react"
import ChallengeCard from "./components/ChallengeCard"
import { ShieldAlert, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../Components/ui/button"

/**
 * ChallengeList Component
 * Dodana klijentska paginacija za lakše pregledanje velikog broja izazova.
 */
export default function ChallengeList({ 
    filteredChallenges, 
    activeCategory, 
    onAttemptChallenge,
    getDifficultyColor 
}) {
    // --- PAGINACIJA STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const challengesPerPage = 6; // Broj izazova po stranici

    // Resetiraj na prvu stranicu ako se promijeni kategorija (filter)
    useMemo(() => {
        setCurrentPage(1);
    }, [activeCategory, filteredChallenges.length]);

    // Izračun podataka za prikaz
    const indexOfLastChallenge = currentPage * challengesPerPage;
    const indexOfFirstChallenge = indexOfLastChallenge - challengesPerPage;
    const currentChallenges = filteredChallenges.slice(indexOfFirstChallenge, indexOfLastChallenge);
    const totalPages = Math.ceil(filteredChallenges.length / challengesPerPage);

    // --- EMPTY STATE ---
    if (filteredChallenges.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 shadow-sm flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                    <ShieldAlert className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">
                    No Targets Found
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed font-medium">
                    {activeCategory === "all" 
                        ? "The global vault is currently empty. Check back later for new deployments." 
                        : "No active challenges match the selected category or search parameters."}
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* --- LIST HEADER --- */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <LayoutGrid className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.15em]">
                        Available_Targets <span className="text-indigo-600">({filteredChallenges.length})</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            </div>

            {/* --- CHALLENGE GRID --- */}
            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {currentChallenges.map((challenge) => (
                    <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onAttempt={() => onAttemptChallenge(challenge)}
                        getDifficultyColor={getDifficultyColor}
                    />
                ))}
            </div>
            
            {/* --- PAGINATION CONTROLS --- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>

                    <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNum = i + 1;
                            // Prikazuj samo prvu, zadnju i stranice oko trenutne ako ih ima puno
                            if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) return <span key={pageNum} className="text-slate-300">...</span>;
                                return null;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${
                                        currentPage === pageNum 
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                                        : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-30"
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* --- DECORATOR --- */}
            <div className="py-4 flex items-center justify-center opacity-40">
                <div className="h-px bg-slate-300 flex-1"></div>
                <span className="px-6 text-[9px] font-mono text-slate-400 tracking-[0.3em] font-bold">
                    SYSTEM_STABLE // END_OF_LIST
                </span>
                <div className="h-px bg-slate-300 flex-1"></div>
            </div>
        </div>
    )
}