import { StarBackground } from "../components/StarBackground";
import { HeroOnboarding } from "../components/HeroOnboarding";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      {/* Background Starfield */}
      <StarBackground />

      {/* Hero Onboarding Content */}
      <div className="relative z-10">
        <HeroOnboarding />
      </div>
    </main>
  );
}
