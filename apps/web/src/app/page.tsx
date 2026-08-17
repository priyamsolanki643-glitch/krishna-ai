import { HeroOnboarding } from "../components/HeroOnboarding";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4">
      {/* 100% Pure Pitch Black Background with Hero Onboarding */}
      <HeroOnboarding />
    </main>
  );
}
