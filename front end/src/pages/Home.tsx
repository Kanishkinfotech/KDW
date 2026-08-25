import HeroCarousel from '../components/home/HeroCarousel';
import CategoryGrid from '../components/home/CategoryGrid';
import BestSellers from '../components/home/BestSellers';
import BundlesSection from '../components/home/BundlesSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import HomeFAQ from '../components/home/HomeFAQ';
import FinalCTA from '../components/home/FinalCTA';
import SEO from '../components/SEO';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <SEO title="Kanishk Digital World — Premium Digital Products Marketplace" description="Discover and download high-quality website templates, UI kits, AI tools, bundles, and digital resources." />
      <HeroCarousel />
      <CategoryGrid />
      <BestSellers />
      <BundlesSection />
      <TestimonialsSection />
      <HomeFAQ />
      <FinalCTA />
    </div>
  );
}
