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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto pb-10">
      <div className="max-w-6xl w-full space-y-8 animate-in fade-in zoom-in-95 duration-500 py-10">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest animate-pulse">
            <Zap className="w-3.5 h-3.5 fill-current" /> Payment Required
          </div>
          <h1 className="text-5xl font-black font-heading tracking-tight text-white">
            Choose Your <span className="text-primary">Automation Tier</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Unlock the power of Sparkyn's AI engine. Select a plan to start your 24/7 social presence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => (
            <div 
              key={tier.id} 
              className={`relative card flex flex-col p-8 space-y-8 h-full transition-all duration-300 ${
                tier.highlight 
                ? 'border-primary shadow-[0_0_50px_-12px_hsla(var(--primary),0.3)] ring-2 ring-primary/20 scale-105 z-10' 
                : 'border-white/5 hover:border-white/10'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${tier.highlight ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                    {tier.id === 'basic' && <Sparkles className="w-6 h-6" />}
                    {tier.id === 'pro' && <Zap className="w-6 h-6" />}
                    {tier.id === 'enterprise' && <Building className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-heading">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">/{tier.interval}</span>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">What&apos;s Included:</p>
                <div className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="p-0.5 rounded-full bg-success/10 text-success shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleSubscribe(tier.id)}
                disabled={!!loadingTier}
                className={`btn w-full py-6 rounded-2xl font-black text-sm uppercase tracking-widest gap-2 flex items-center justify-center group overflow-hidden ${
                  tier.highlight 
                  ? 'btn-primary shadow-[0_10px_30px_-10px_hsla(var(--primary),0.5)]' 
                  : 'btn-outline border-white/10 hover:bg-white/5'
                }`}
              >
                {loadingTier === tier.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Subscribe Now
                    <ChevronRight className={`w-4 h-4 transition-transform ${tier.highlight ? 'group-hover:translate-x-1' : ''}`} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center pt-8">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            Secure processing by <span className="text-white font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-tighter">Stripe</span>
          </p>
        </div>
      </div>
    </div>
  )
}
