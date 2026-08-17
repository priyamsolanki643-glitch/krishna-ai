export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Ambient Edge Glows (Chrome Profile Picker Style with Pure Pitch Black Center) */}
      
      {/* Top-Left: Emerald / Cyan Ambient Glow */}
      <div 
        className="pointer-events-none fixed -top-32 -left-32 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full opacity-60 blur-[100px] sm:blur-[140px] transition-all duration-1000 animate-pulse-subtle"
        style={{
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(6, 182, 212, 0.25) 50%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Top-Right: Violet / Magenta / Purple Ambient Glow */}
      <div 
        className="pointer-events-none fixed -top-32 -right-32 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full opacity-55 blur-[100px] sm:blur-[140px] transition-all duration-1000 animate-pulse-subtle"
        style={{
          background: "radial-gradient(circle, rgba(168, 85, 247, 0.32) 0%, rgba(236, 72, 153, 0.22) 50%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Bottom-Left: Subtle Deep Indigo / Azure Edge Accent */}
      <div 
        className="pointer-events-none fixed -bottom-32 -left-32 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full opacity-35 blur-[90px] sm:blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 60%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Bottom-Right: Subtle Amber / Warm Glow */}
      <div 
        className="pointer-events-none fixed -bottom-32 -right-32 w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] rounded-full opacity-30 blur-[90px] sm:blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(217, 70, 239, 0.12) 60%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Pure Pitch Black Center Canvas Content */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center justify-center text-center">
        {/* Ready for Onboarding Cards & Content */}
      </div>
    </main>
  );
}
