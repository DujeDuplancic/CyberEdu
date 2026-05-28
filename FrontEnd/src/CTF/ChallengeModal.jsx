"use client"

import { useState } from "react"
import { Button } from "../Components/ui/button"
import { Input } from "../Components/ui/input"
import { Badge } from "../Components/ui/badge"
import { useNotifications } from '../contexts/NotificationContext'
import { api } from '../lib/api'
import { 
    Download, File, CheckCircle, ExternalLink, 
    X, Info, AlertTriangle, Terminal, Trophy, 
    ShieldAlert, Loader2, XCircle, FolderArchive, Image, FileText
} from "lucide-react"

export default function ChallengeModal({ challenge, onClose, onSolve, isSolved = false }) {
    const [flag, setFlag] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState('idle')
    const [downloading, setDownloading] = useState(false)
    const { showAchievement, showSuccess, showError } = useNotifications()

    if (!challenge) return null

    const handleDownload = async () => {
        if (!challenge.file_url) {
            showError('No file available for this challenge')
            return
        }

        setDownloading(true)
        try {
            // Construct the full URL for the file
            let fileUrl = challenge.file_url
            
            // If it's a relative path, make it absolute
            if (fileUrl.startsWith('/')) {
                fileUrl = `http://localhost:5173${fileUrl}`
            } else if (!fileUrl.startsWith('http')) {
                fileUrl = `http://localhost/CyberEdu/Backend/uploads/challenges/${fileUrl}`
            }
            
            // Get filename from URL
            const filename = fileUrl.split('/').pop() || 'challenge_file'
            
            // Create download link
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = filename
            link.target = '_blank'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            showSuccess('Download started', filename)
        } catch (error) {
            console.error('Download error:', error)
            showError('Failed to download file')
        } finally {
            setDownloading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!flag.trim()) return

        setSubmitting(true)
        setStatus('idle')

        try {
            const userData = localStorage.getItem('user')
            const user = JSON.parse(userData)
            
            const response = await api.post('/challenges/submit_flag.php', {
                user_id: user.id,
                challenge_id: challenge.id,
                flag: flag.trim()
            })

            if (response.success) {
                setStatus('success')
                showSuccess(`+${response.points} points!`, 'Correct Flag!')
                if (onSolve) onSolve(challenge.id, response.points)
                setTimeout(onClose, 1500)
            } else {
                setStatus('error')
                showError('Incorrect flag, try again.')
                setTimeout(() => setStatus('idle'), 2000)
            }
        } catch (error) {
            showError('Server error')
        } finally {
            setSubmitting(false)
        }
    }

    const getInputStyles = () => {
        if (status === 'success') return "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        if (status === 'error') return "border-rose-500 bg-rose-50 text-rose-700 animate-shake"
        return "border-slate-200 bg-white text-slate-700 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
    }

    const getFileIcon = (filename) => {
        if (!filename) return <File className="h-4 w-4" />
        const ext = filename.split('.').pop().toLowerCase()
        if (ext === 'zip' || ext === 'rar' || ext === '7z') return <FolderArchive className="h-4 w-4" />
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return <Image className="h-4 w-4" />
        if (ext === 'pdf') return <FileText className="h-4 w-4" />
        if (ext === 'txt') return <FileText className="h-4 w-4" />
        if (ext === 'bin') return <Terminal className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    const getFileName = () => {
        if (!challenge.file_url) return null
        return challenge.file_url.split('/').pop()
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
                
                {/* HEADER */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white relative">
                    <div className="absolute top-6 right-6 z-20">
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="relative z-10 flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Terminal className="h-7 w-7 text-indigo-100" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight">{challenge.title}</h2>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">{challenge.category_name}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#fcfdfe]">
                    
                    {/* BRIEFING */}
                    <section className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Info className="h-3.5 w-3.5" /> Mission Briefing
                        </h3>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 leading-relaxed text-slate-600 font-medium italic">
                            {challenge.description || "No description provided."}
                        </div>
                    </section>

                    {/* HANDOUTS & FILES SECTION - Now using file_url from database */}
                    {challenge.file_url && (
                        <section className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Download className="h-3.5 w-3.5" /> Handouts & Resources
                            </h3>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                            {getFileIcon(getFileName())}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-mono text-sm font-medium text-slate-700 break-all">
                                                {getFileName()}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Download this resource to complete the challenge
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleDownload}
                                        disabled={downloading}
                                        variant="outline"
                                        size="sm"
                                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                                    >
                                        {downloading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SUBMISSION AREA */}
                    {!isSolved ? (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Terminal className="h-3.5 w-3.5" /> Submit Credentials
                                </h3>
                                <span className="text-[10px] font-mono text-slate-300 font-bold">STATUS: AWAITING_INPUT</span>
                            </div>

                            <div className={`p-8 rounded-[2rem] border transition-all duration-300 ${
                                status === 'idle' ? "bg-slate-50 border-slate-200" : 
                                status === 'success' ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                            }`}>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            placeholder="CTF{your_flag_here}"
                                            value={flag}
                                            onChange={(e) => setFlag(e.target.value)}
                                            className={`h-16 pl-6 rounded-2xl text-lg font-mono transition-all duration-300 ${getInputStyles()}`}
                                            disabled={submitting || status === 'success'}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            {status === 'success' && <CheckCircle className="text-emerald-500 h-6 w-6 animate-bounce" />}
                                            {status === 'error' && <XCircle className="text-rose-500 h-6 w-6" />}
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        type="submit"
                                        disabled={submitting || !flag.trim() || status === 'success'}
                                        className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                                            status === 'success' 
                                                ? "bg-emerald-500 text-white" 
                                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                        }`}
                                    >
                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : status === 'success' ? "Access Granted" : "Verify Flag"}
                                    </Button>
                                </form>
                            </div>
                        </section>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-10 flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-emerald-900 uppercase">Mission Accomplished</h3>
                            <p className="text-emerald-700 font-medium max-w-xs">You've successfully breached this target and secured the data.</p>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
                    <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Authorized Access Only • System Logs Active</p>
                </div>
            </div>
        </div>
    )
}