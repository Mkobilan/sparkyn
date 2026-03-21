'use client'

import { PRICING_TIERS } from '@/lib/pricing'
import { Check, Zap, Sparkles, Building, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function PricingModalContent() {
  const searchParams = useSearchParams()
  const errorMsg = searchParams.get('message')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [internalError, setInternalError] = useState<string | null>(null)

  const handleSubscribe = (tierId: string) => {
    setLoadingTier(tierId)
    window.location.href = `/api/checkout?tier=${tierId}`
  }

  const error = errorMsg || internalError

  // Define some custom colors based on globals.css variables
  const primaryColor = 'hsl(var(--primary))'
  const cardBg = 'hsl(var(--card))'
  const successColor = 'hsl(var(--success))'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      backgroundColor: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      overflowY: 'auto',
      color: 'white'
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '40%',
        height: '40%',
        backgroundColor: 'hsla(var(--primary), 0.1)',
        borderRadius: '50%',
        filter: 'blur(120px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '3rem'
      }}>
        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '1rem',
            padding: '1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#ef4444',
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'fade-in 0.3s ease'
          }}>
            <AlertTriangle size={20} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 800, marginBottom: '2px' }}>Checkout Failed</p>
              <p style={{ opacity: 0.8, fontSize: '0.8rem' }}>{error}</p>
            </div>
            <button 
              onClick={() => setInternalError(null)}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.5 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Header section section */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div className="badge shimmer-border" style={{ 
            color: 'white', 
            marginBottom: '1.5rem',
            padding: '0.5rem 1.25rem'
          }}>
            <Zap size={14} style={{ marginRight: '6px' }} /> Premium Experience
          </div>
          <h1 style={{ 
            fontSize: '3.5rem', 
            marginBottom: '1rem',
            lineHeight: 1.1
          }}>
            Choose Your <span style={{ color: primaryColor }}>Automation Plan</span>
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.2rem', fontWeight: 500 }}>
            Select a tier to activate your dashboard. Lock in these introductory rates while they last.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '2.5rem',
          justifyContent: 'center',
          alignItems: 'stretch',
          padding: '1rem'
        }}>
          {PRICING_TIERS.map((tier) => (
            <div 
              key={tier.id} 
              className="card glow-amber"
              style={{
                flex: '1 1 350px',
                minWidth: '350px',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                padding: '3rem',
                backgroundColor: tier.highlight ? '#0f0f0f' : '#070707',
                border: `2px solid ${tier.highlight ? primaryColor : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '3rem',
                position: 'relative',
                transform: tier.highlight ? 'scale(1.05)' : 'scale(1)',
                zIndex: tier.highlight ? 10 : 1,
                boxShadow: tier.highlight ? `0 25px 50px -12px hsla(var(--primary), 0.25)` : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {tier.highlight && (
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: primaryColor,
                  color: 'black',
                  padding: '4px 16px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  boxShadow: `0 4px 20px hsla(var(--primary), 0.4)`
                }}>
                  Recommended
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '1rem',
                  backgroundColor: tier.highlight ? 'hsla(var(--primary), 0.1)' : 'hsla(0,0%,100%,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tier.highlight ? primaryColor : 'white'
                }}>
                  {tier.id === 'basic' && <Sparkles size={28} />}
                  {tier.id === 'pro' && <Zap size={28} />}
                  {tier.id === 'enterprise' && <Building size={28} />}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    color: tier.highlight ? primaryColor : 'hsl(var(--muted-foreground))',
                    marginBottom: '4px'
                  }}>
                    {tier.name.split(' ')[1]} Plan
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{tier.price}</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>/mo</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', letterSpacing: '0.1em' }}>
                  Features Included:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tier.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        marginTop: '2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: tier.highlight ? 'hsla(var(--primary), 0.2)' : 'hsla(0,0%,100%,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: tier.highlight ? primaryColor : 'white',
                        flexShrink: 0
                      }}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span style={{ fontSize: '0.9rem', color: '#ccc', fontWeight: 500 }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleSubscribe(tier.id)}
                disabled={!!loadingTier}
                className={tier.highlight ? 'btn btn-primary' : 'btn btn-outline'}
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {loadingTier === tier.id ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Activate Plan <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Footer trust badges */}
        <div style={{ 
          textAlign: 'center', 
          opacity: 0.5, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '1rem'
        }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Payments processed securely by Stripe
          </p>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" 
            alt="Stripe" 
            style={{ height: '24px', filter: 'brightness(0) invert(1)' }} 
          />
        </div>
      </div>
    </div>
  )
}

export default function PricingModal() {
  return (
    <Suspense fallback={
       <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
         <Loader2 size={40} className="animate-spin text-primary" />
       </div>
    }>
      <PricingModalContent />
    </Suspense>
  )
}
