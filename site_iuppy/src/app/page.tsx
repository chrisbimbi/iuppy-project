import { HomeHero } from "@/components/sections/HomeHero";

import { HomeIntegrations } from "@/components/sections/HomeIntegrations";
import { HomeResources } from "@/components/sections/HomeResources";
import { HomeStats } from "@/components/sections/HomeStats";
import { HomeProblems } from "@/components/sections/HomeProblems";
import { PersonaSection } from "@/components/sections/PersonaSection";
import { NR1HomeSection } from "@/components/sections/NR1HomeSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { BookingSection } from "@/components/sections/BookingSection";
import { NR1CrossSell } from "@/components/sections/NR1CrossSell";
import { PreFooterCTA } from "@/components/layout/PreFooterCTA";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar"; // Ensure Navbar is imported if not already

export default function Home() {
  return (
    <>
      <HomeHero />

      <HomeStats />
      <HomeProblems />
      <HomeIntegrations />
      <PersonaSection />
      <NR1HomeSection />
      <SolutionSection />
      <HomeResources />
      <BookingSection />
      <NR1CrossSell variant="general" />
      <PreFooterCTA />
    </>
  );
}
