import React from "react";
import { Navbar } from "../../components/Navbar";

export default function ModelsPage() {
  return (
    <div className="relative min-h-screen bg-[#000000] overflow-hidden flex flex-col items-center justify-center font-sans">
      <Navbar />
      <div className="text-center">
        <h1 className="text-5xl sm:text-7xl font-['Instrument_Serif',serif] text-white tracking-tight">Models Library</h1>
        <p className="text-zinc-400 text-sm mt-4 font-mono uppercase tracking-widest">System architecture coming soon</p>
      </div>
    </div>
  );
}
