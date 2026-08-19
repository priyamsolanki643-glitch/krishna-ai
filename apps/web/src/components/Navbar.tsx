"use client";
    
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();

  const links = [
    { name: "Features", path: "/features" },
    { name: "Pricing", path: "/pricing" },
  ];

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl h-[54px] px-3.5 sm:px-5 flex items-center justify-between bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-2xl rounded-full border border-white/[0.12] border-t-white/[0.25] shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]">
      
      {/* Left Group (Brand + Links) */}
      <div className="flex items-center">
        
        {/* Brand Item */}
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-white tracking-tight mr-4 cursor-pointer">
          <Globe className="w-4 h-4 text-white" />
          <span>The Council</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link 
                key={link.name} 
                href={link.path} 
                className={
                  isActive
                    ? "text-[13px] text-white font-medium bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full shadow-sm transition-colors"
                    : "text-[13px] text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full transition-colors"
                }
              >
                {link.name}
              </Link>
            );
          })}
        </div>

      </div>
    </nav>
  );
};
