
'use client'

import React from 'react'
import { AlertCircle, Copy, X, CheckCircle2 } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  errorDetails?: any
}

export default function ErrorModal({ isOpen, onClose, title = "Generation Exception", message, errorDetails }: ErrorModalProps) {
  const [copied, setCopied] = React.useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    const trace = JSON.stringify({
      message,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    }, null, 2)
    
    navigator.clipboard.writeText(trace)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="card-premium max-w-lg w-full p-8 space-y-6 shadow-[0_0_100px_rgba(255,0,0,0.1)] border-destructive/20 bg-[#0f0f0f] relative animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-3xl bg-destructive/10 text-destructive border border-destructive/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <AlertCircle className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-black font-heading text-white tracking-tighter italic">
              {title}
            </h3>
            <p className="text-destructive/80 font-bold text-sm leading-relaxed px-4">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleCopy}
            className="btn flex-1 h-14 bg-white/5 hover:bg-white/10 border-white/10 text-white font-black uppercase tracking-widest text-[10px] gap-2 rounded-2xl transition-all active:scale-95"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Trace
              </>
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="btn btn-primary flex-1 h-14 font-black uppercase tracking-widest text-[10px] shadow-lg rounded-2xl active:scale-95 transition-all"
          >
            Dismiss
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center font-medium">
          Error logged to system console. Provide trace to support if issue persists.
        </p>
      </div>
    </div>
  )
}
