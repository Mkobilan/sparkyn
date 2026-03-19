import Link from 'next/link'
import { Sparkles, Shield, Lock, Eye, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2 group">
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary w-6 h-6" />
          <span className="text-xl font-bold tracking-tighter text-foreground">Sparkyn</span>
        </div>
      </nav>

      <main className="container max-w-3xl py-12 space-y-12 pb-32">
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 rounded-2xl w-fit">
            <Shield className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: March 19, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Eye className="w-5 h-5 text-primary" /> 1. Data Collection
            </h2>
            <p>
              To provide our AI-automated social media services, Sparkyn collects your business profile information (industry, goals, description) and social media access tokens when you connect your accounts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <Lock className="w-5 h-5 text-primary" /> 2. Data Usage
            </h2>
            <p>
              We use your data strictly to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Train our AI engine on your specific brand voice.</li>
              <li>Generate and schedule content for your connected platforms.</li>
              <li>Publish posts, reels, and shorts to your social media accounts on your behalf.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
              3. Data Security
            </h2>
            <p>
              Your social media tokens are encrypted and stored securely using industry-standard protocols. We never share your personal data or business insights with third parties other than the AI models used for content generation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">
              4. Third-Party Services
            </h2>
            <p>
              Our application integrates with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>**Meta (Facebook/Instagram)**: To publish posts.</li>
              <li>**TikTok**: To upload videos/reels.</li>
              <li>**YouTube**: To upload Shorts.</li>
              <li>**Google Gemini**: To generate AI content.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
