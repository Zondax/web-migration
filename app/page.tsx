import BackgroundPaths from '@/components/kokonutui/background-paths';
import FeatureSection from '@/components/sections/feature-section';
import ProblemSection from '@/components/sections/problem-section';
import SolutionSection from '@/components/sections/solution-section';
import AudienceSection from '@/components/sections/audience-section';
import CallToAction from '@/components/sections/call-to-action';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <BackgroundPaths
        title="Welcome to the Polkadot Ledger Migration Assistant"
        subtitle="Simplifying your journey to the new Polkadot Universal Ledger App"
      />

      {/* Feature Section */}
      <FeatureSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* Audience Section */}
      <AudienceSection />

      {/* Call to Action */}
      <CallToAction />
    </main>
  );
}
