"use client"

import { Card, CardContent } from "../../Components/ui/card"
import { Badge } from "../../Components/ui/badge"
import { Button } from "../../Components/ui/button"
import { CheckCircle, Trophy, Users, ChevronRight, Zap } from "lucide-react"

/**
 * ChallengeCard Component
 * Prikazuje CTF izazov kao moderan, horizontalni red.
 */
export default function ChallengeCard({ challenge, onAttempt }) {
    const isSolved = !!challenge.solved;

    // Lokalna funkcija za boje težine (rješava TypeError)
    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case "Easy": return "bg-emerald-50/50 text-emerald-600 border-emerald-100"
            case "Medium": return "bg-amber-50/50 text-amber-600 border-amber-100"
            case "Hard": return "bg-rose-50/50 text-rose-600 border-rose-100"
            default: return "bg-slate-50 text-slate-500 border-slate-100"
        }
    }

    return (
        <Card className={`group transition-all duration-300 border-slate-200 overflow-hidden ${
            isSolved 
                ? "bg-slate-50/40 opacity-90 shadow-none" 
                : "bg-white hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200"
        }`}>
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                    
                    {/* --- LIJEVA STRANA: Naslov i Status --- */}
                    <div className="flex items-start gap-4 flex-1">
                        {/* Status Icon sa novom indigo-plavom */}
                        <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isSolved 
                                ? "bg-emerald-100/60 text-emerald-600 shadow-inner" 
                                : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:scale-110"
                        }`}>
                            {isSolved ? <CheckCircle className="h-6 w-6" /> : <Zap className="h-5 w-5 fill-current" />}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`text-[17px] font-bold leading-tight transition-colors ${
                                    isSolved ? "text-slate-500" : "text-slate-800"
                                }`}>
                                    {challenge.title}
                                </h3>
                                
                                {/* Difficulty Badge - border dodan za bolji "SaaS" izgled */}
                                <Badge 
                                    variant="outline"
                                    className={`text-[10px] uppercase font-black px-2 py-0.5 border shadow-none tracking-wide ${getDifficultyColor(challenge.difficulty)}`}
                                >
                                    {challenge.difficulty}
                                </Badge>
                            </div>
                            
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                {challenge.category_name}
                            </p>
                        </div>
                    </div>

                    {/* --- SREDINA: Statistika --- */}
                    <div className="flex items-center gap-6 px-2 sm:px-6">
                        <div className="flex flex-col items-center sm:items-start min-w-[60px]">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mb-0.5">Reward</span>
                            <div className={`flex items-center gap-1.5 font-mono font-black ${isSolved ? "text-slate-400" : "text-indigo-500"}`}>
                                <Trophy className="h-3.5 w-3.5" />
                                <span>{challenge.points}</span>
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                        <div className="flex flex-col items-center sm:items-start min-w-[60px]">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mb-0.5">Solves</span>
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                                <Users className="h-3.5 w-3.5" />
                                <span>{challenge.solves_count || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- DESNA STRANA: Tipka za akciju --- */}
                    <div className="sm:pl-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0">
                        <Button 
                            variant={isSolved ? "outline" : "default"}
                            size="lg"
                            className={`w-full sm:w-[150px] font-bold rounded-xl transition-all duration-300 transform active:scale-95 ${
                                isSolved 
                                    ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-white" 
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                            }`}
                            onClick={() => onAttempt(challenge)}
                        >
                            {isSolved ? (
                                <span className="flex items-center gap-2">Completed</span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Launch <ChevronRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
    )
}