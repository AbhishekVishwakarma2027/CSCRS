import {
  AccessibilityBar,
  GovernmentHeader,
  Navbar,
  HeroSlider,
  Statistics,
  StateDashboard,
  WhoWeAre,
  WorkflowSection,
  MobileAppPromo,
  PlatformFeatures,
  LatestUpdates,
  FAQSection,
  ContactSection,
  Footer,
  ScrollToTop,
} from '@/components/landing'
import type { HeroSlide } from '@/components/landing/HeroSlider'

const MOCK_SLIDES: HeroSlide[] = [
  {
    title: 'Transforming Civic Governance through Digital Integration',
    subtitle: 'Citizen-Centric Administration',
    description:
      'A unified platform connecting public reports directly with department operations. Streamlining civic resolution workflows with full transparency and verified outcomes.',
    primaryCtaText: 'How it Works',
    primaryCtaLink: 'how-it-works',
    secondaryCtaText: 'Learn More',
    secondaryCtaLink: 'about',
    backgroundClass: 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950',
  },
  {
    title: 'Unified Dashboard & Role-Adaptive Department Operations',
    subtitle: 'Administrative Efficiency',
    description:
      'Empowering city administrators and departments with automated routing, geo-verified resolution reviews, and data-driven performance analytics.',
    primaryCtaText: 'Explore Statistics',
    primaryCtaLink: 'statistics',
    secondaryCtaText: 'State Dashboard',
    secondaryCtaLink: 'state-dashboard',
    backgroundClass: 'bg-gradient-to-r from-neutral-950 via-slate-900 to-emerald-950',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#f4f7fc] via-[#f7f6fd] to-[#f2f6fc]">
      {/* Top Accessibility Options */}
      <AccessibilityBar />

      {/* Corporate Branding Header */}
      <GovernmentHeader />

      {/* Navigation Headers */}
      <Navbar />

      {/* Main Sections Composition Layer */}
      <main id="main-content" className="flex-grow focus:outline-none">
        {/* Dynamic Image Banner */}
        <HeroSlider slides={MOCK_SLIDES} />

        {/* Global Operations Metric Strips */}
        <Statistics />

        {/* Introduction Section */}
        <WhoWeAre />

        {/* Operational Flowcharts */}
        <WorkflowSection />

        {/* Citizen App Download Promo Section */}
        <MobileAppPromo />

        {/* Regional Performance Metrics Map Selector */}
        <StateDashboard />

        {/* Security & Audit features */}
        <PlatformFeatures />

        {/* News updates list */}
        <LatestUpdates />

        {/* Help desk accordions */}
        <FAQSection />

        {/* Enquiry form submission */}
        <ContactSection />
      </main>

      {/* Expanded Sitemap Policies Footer */}
      <Footer />

      {/* Floating Scroll to Top button */}
      <ScrollToTop />
    </div>
  )
}
