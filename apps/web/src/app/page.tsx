import { StarfieldBackground } from "../components/StarfieldBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 60fps Aesthetic Moving Deep-Space Stars Background */}
      <StarfieldBackground />

      {/* Foreground Container for Onboarding */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center justify-center text-center">
        {/* Ready for Onboarding elements */}
      </div>
    </main>
  );
}
