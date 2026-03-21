'use client'

import { PRICING_TIERS } from '@/lib/pricing'
import { Check, Zap, Sparkles, Building, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PricingModal() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null)

  const handleSubscribe = (tierId: string) => {
    setLoadingTier(tierId)
    window.location.href = `/api/checkout?tier=${tierId}`
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-[#050505] flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl w-full space-y-12 relative animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]">
            <Zap className="w-4 h-4 fill-current animate-pulse" /> Sparkyn Premium
          </div>
          <h1 className="text-6xl font-black font-heading tracking-tight text-white leading-tight">
            Complete Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-foreground">Subscription</span>
          </h1>
          <p className="text-muted-foreground text-xl font-medium max-w-xl mx-auto">
            You&apos;re one step away from 24/7 AI-powered social automation. Choose a tier to unlock your dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {PRICING_TIERS.map((tier) => (
            <div 
              key={tier.id} 
              className={`relative flex flex-col p-10 rounded-[2.5rem] border transition-all duration-500 group ${
                tier.highlight 
                ? 'bg-[#0f0f0f] border-primary/40 shadow-[0_0_80px_-20px_hsla(var(--primary),0.3)] ring-1 ring-primary/30 scale-105 z-10' 
                : 'bg-[#0a0a0a] border-white/5 hover:border-white/10 hover:bg-[#0c0c0c]'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-black text-[11px] font-black uppercase tracking-widest rounded-full shadow-[0_4px_20px_rgba(var(--primary),0.5)]">
                  Recommended Choice
                </div>
              )}

              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <div className={`p-4 rounded-2xl ${tier.highlight ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                    {tier.id === 'basic' && <Sparkles className="w-8 h-8" />}
                    {tier.id === 'pro' && <Zap className="w-8 h-8" />}
                    {tier.id === 'enterprise' && <Building className="w-8 h-8" />}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black uppercase tracking-widest ${tier.highlight ? 'text-primary' : 'text-muted-foreground'}`}>
                      {tier.name.split(' ')[1]}
                    </p>
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-4xl font-black text-white">{tier.price}</span>
                      <span className="text-muted-foreground text-xs">/mo</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic border-l-2 border-primary/20 pl-4">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-6 mb-10">
                <div className="space-y-4">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-4 text-sm text-gray-300">
                      <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${tier.highlight ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/40'}`}>
                        <Check className="w-3 h-3 stroke-[4]" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleSubscribe(tier.id)}
                disabled={!!loadingTier}
                className={`w-full py-5 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] gap-3 flex items-center justify-center transition-all duration-300 group ${
                  tier.highlight 
                  ? 'bg-primary text-black hover:scale-[1.02] shadow-[0_15px_30px_rgba(var(--primary),0.3)] active:scale-95' 
                  : 'bg-white text-black hover:bg-white/90 active:scale-95'
                }`}
              >
                {loadingTier === tier.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Activate Plan
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest flex items-center gap-3">
            <span className="w-8 h-[1px] bg-white/10" />
            Locked-in Intro Pricing
            <span className="w-8 h-[1px] bg-white/10" />
          </p>
          <div className="flex gap-8 opacity-50">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5 brightness-0 invert" />
          </div>
        </div>
      </div>
    </div>
  )
}
