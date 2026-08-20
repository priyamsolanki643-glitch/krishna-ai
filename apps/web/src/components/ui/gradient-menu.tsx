"use client";

import React from "react";
import { IoHomeOutline, IoVideocamOutline, IoCameraOutline, IoShareSocialOutline, IoHeartOutline } from "react-icons/io5";

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  onClick?: () => void;
}

const defaultMenuItems: MenuItem[] = [
  { title: "Home", icon: <IoHomeOutline />, gradientFrom: "#a955ff", gradientTo: "#ea51ff" },
  { title: "Video", icon: <IoVideocamOutline />, gradientFrom: "#56CCF2", gradientTo: "#2F80ED" },
  { title: "Photo", icon: <IoCameraOutline />, gradientFrom: "#FF9966", gradientTo: "#FF5E62" },
  { title: "Share", icon: <IoShareSocialOutline />, gradientFrom: "#80FF72", gradientTo: "#7EE8FA" },
  { title: "Tym", icon: <IoHeartOutline />, gradientFrom: "#ffa9c6", gradientTo: "#f434e2" }
];

interface GradientMenuProps {
  items?: MenuItem[];
  className?: string;
}

export default function GradientMenu({ items = defaultMenuItems, className = "" }: GradientMenuProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <ul className="flex gap-3 sm:gap-6 p-2 rounded-full">
        {items.map(({ title, icon, gradientFrom, gradientTo, onClick }, idx) => (
          <li
            key={idx}
            onClick={onClick}
            style={{ "--gradient-from": gradientFrom, "--gradient-to": gradientTo } as React.CSSProperties}
            className="relative w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg rounded-full flex items-center justify-center transition-all duration-500 hover:w-[130px] sm:hover:w-[160px] hover:shadow-none group cursor-pointer"
          >
            {/* Gradient background on hover */}
            <span className="absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] opacity-0 transition-all duration-500 group-hover:opacity-100"></span>
            
            {/* Blur glow */}
            <span className="absolute top-[8px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gradient-from),var(--gradient-to))] blur-[15px] opacity-0 -z-10 transition-all duration-500 group-hover:opacity-50"></span>

            {/* Icon */}
            <span className="relative z-10 transition-all duration-500 group-hover:scale-0 delay-0 flex items-center justify-center">
              <span className="text-xl sm:text-2xl text-white">{icon}</span>
            </span>

            {/* Title */}
            <span className="absolute text-white font-bold uppercase tracking-wider text-xs sm:text-sm transition-all duration-500 scale-0 group-hover:scale-100 delay-150 whitespace-nowrap">
              {title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
