import Hero from '@/components/Hero';
import SportsSection from '@/components/SportsSection';
import SportsHighlight from '@/components/SportsHighlight';
import Testimonials from '@/components/Testimonials';
import Gallery from '@/components/Gallery';
import LocationContact from '@/components/LocationContact';
import Footer from '@/components/Footer';
import WhyUsSection from '@/components/WhyUsSection';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col text-foreground pb-0 overflow-x-hidden">
      <Hero />

      <SportsHighlight />

      <SportsSection />

      <WhyUsSection />

      <Testimonials />

      <Gallery />
      <LocationContact />
      <Footer />
    </main>
  );
}
