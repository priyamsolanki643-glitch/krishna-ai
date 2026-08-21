"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Globe, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

interface AuthProps {
  defaultMode?: "signup" | "login";
}

export const AuthComponent: React.FC<AuthProps> = ({ defaultMode = "signup" }) => {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);
  const [authMethod, setAuthMethod] = useState<"select" | "email" | "otp">("select");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMode = () => {
    setMode(mode === "signup" ? "login" : "signup");
    setAuthMethod("select");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      router.push(mode === "signup" ? "/pricing" : "/app");
    }, 800);
  };

  const handleDirectAuth = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      router.push(mode === "signup" ? "/pricing" : "/app");
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      
      {/* FULL SCREEN AURORA BACKGROUND */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/60 via-indigo-950/80 to-black" />
      <div className="absolute top-[-10vw] left-[-10vw] w-[60vw] h-[60vw] bg-purple-600/40 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[-10vw] right-[-10vw] w-[50vw] h-[50vw] bg-indigo-500/30 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* CENTERED GLASS CARD */}
      <div className="w-full max-w-[440px] bg-zinc-950/60 border border-white/10 rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative z-10 overflow-hidden flex flex-col px-6 py-10 sm:px-10 min-h-[560px]">
        
        {/* Header inside Card */}
        <div className="w-full text-center flex flex-col items-center mb-8 relative z-10">
          <Link href="/" className="text-xs font-medium tracking-wide flex items-center justify-center gap-2 text-white/90 hover:text-white mb-6">
            <Globe className="w-4 h-4" />
            The Council
          </Link>
          <h2 className="text-3xl font-['Instrument_Serif',serif] font-light text-white tracking-tight">
            {mode === "signup" ? "Join The Council" : "Welcome Back"}
          </h2>
          <p className="text-[13px] text-zinc-300/80 mt-2 leading-relaxed">
            Autonomous multi-agent consensus architecture.
          </p>
        </div>

        <div className="relative w-full flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* STAGE 1: Selection */}
            {authMethod === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex flex-col flex-1"
              >
                <div className="space-y-3 mb-6">
                  <button onClick={handleDirectAuth} className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-semibold text-[13px] flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-md">
                    <GoogleIcon />
                    Continue with Google
                  </button>
                  <button onClick={handleDirectAuth} className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/20 text-white font-medium text-[13px] flex items-center justify-center gap-3 transition-all">
                    <GithubIcon />
                    Continue with GitHub
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">OR</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => setAuthMethod("email")}
                    className="group w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-[13px] flex items-center justify-between px-5 transition-all"
                  >
                    Continue with Email
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </button>
                  <button 
                    onClick={() => setAuthMethod("otp")}
                    className="group w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium text-[13px] flex items-center justify-between px-5 transition-all"
                  >
                    Continue with Phone (OTP)
                    <Phone className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STAGE 2: Email or OTP Details */}
            {(authMethod === "email" || authMethod === "otp") && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full flex flex-col flex-1"
              >
                <button 
                  onClick={() => setAuthMethod("select")}
                  className="flex items-center gap-2 text-[12px] text-zinc-400 hover:text-white mb-6 transition-colors w-fit"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to options
                </button>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                  
                  {authMethod === "email" && (
                    <>
                      {mode === "signup" && (
                        <input 
                          type="text" 
                          placeholder="Full Name" 
                          required
                          className="w-full bg-zinc-900/50 border border-white/10 focus:border-white/30 focus:bg-zinc-900 rounded-xl px-4 py-3 text-[13px] text-white placeholder-zinc-500 outline-none transition-all"
                        />
                      )}
                      <input 
                        type="email" 
                        placeholder="Email address" 
                        required
                        className="w-full bg-zinc-900/50 border border-white/10 focus:border-white/30 focus:bg-zinc-900 rounded-xl px-4 py-3 text-[13px] text-white placeholder-zinc-500 outline-none transition-all"
                      />
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Password" 
                          required
                          className="w-full bg-zinc-900/50 border border-white/10 focus:border-white/30 focus:bg-zinc-900 rounded-xl px-4 py-3 text-[13px] text-white placeholder-zinc-500 outline-none transition-all pr-12"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </>
                  )}

                  {authMethod === "otp" && (
                    <>
                      <input 
                        type="text" 
                        placeholder="Mobile / Email number" 
                        required
                        className="w-full bg-zinc-900/50 border border-white/10 focus:border-white/30 focus:bg-zinc-900 rounded-xl px-4 py-3 text-[13px] text-white placeholder-zinc-500 outline-none transition-all"
                      />
                      <div className="flex justify-between gap-2 mt-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <input 
                            key={i} 
                            type="text" 
                            maxLength={1} 
                            placeholder="-"
                            className="w-10 sm:w-12 h-12 text-center bg-zinc-900/50 border border-white/10 focus:border-white/30 focus:bg-zinc-900 rounded-xl text-sm font-mono text-white placeholder-zinc-500 outline-none transition-all" 
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-auto pt-6">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-full bg-white text-black font-semibold text-[13px] hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Verifying..." : "Verify & Launch Space"}
                      {!isSubmitting && <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Switch */}
        <div className="mt-8 text-center text-[12.5px] text-zinc-400 relative z-10 border-t border-white/5 pt-6">
          {mode === "signup" ? "Already a member? " : "New to The Council? "}
          <button onClick={toggleMode} className="text-white font-medium hover:underline underline-offset-4">
            {mode === "signup" ? "Log In" : "Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
};
