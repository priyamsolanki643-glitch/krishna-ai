"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
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

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signup" | "login";
  customMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = "signup",
  customMessage
}) => {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);
  const [step, setStep] = useState<"select" | "email_form" | "otp_verify" | "name_onboarding">("select");
  
  // Form State
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setStep("select");
      setEmailOrPhone("");
      setPassword("");
      setFullName("");
      setOtpDigits(["", "", "", "", "", ""]);
      setIsSubmitting(false);
      setResendTimer(45);
    }
  }, [isOpen, defaultMode]);

  // Resend OTP countdown
  useEffect(() => {
    let interval: any;
    if (step === "otp_verify" && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const toggleMode = () => {
    setMode(mode === "signup" ? "login" : "signup");
    setStep("select");
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[index] = val.slice(-1);
    setOtpDigits(next);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const finalizeAuthentication = (userNameVal?: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const finalName = userNameVal || fullName || (emailOrPhone ? emailOrPhone.split("@")[0] : "Operator");
      if (typeof window !== "undefined") {
        localStorage.setItem("userAuth", "true");
        localStorage.setItem("userName", finalName);
        localStorage.setItem("userEmail", emailOrPhone || "user@omni-nexus.ai");
      }
      setIsSubmitting(false);
      onClose();
      
      // If Signup -> Redirect to Pricing (/pricing)
      // If Login -> Redirect to Chat Interface (/app)
      if (mode === "signup") {
        router.push("/pricing");
      } else {
        router.push("/app");
      }
    }, 850);
  };

  const handleSelectProvider = (providerName: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      finalizeAuthentication(`Council Operator (${providerName})`);
    }, 700);
  };

  const handleEmailPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) return;

    if (mode === "signup") {
      setStep("otp_verify");
      setResendTimer(45);
    } else {
      finalizeAuthentication();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otpDigits.join("");
    if (otpCode.length < 6) return;

    if (mode === "signup" && !fullName) {
      setStep("name_onboarding");
    } else {
      finalizeAuthentication();
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    finalizeAuthentication(fullName.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex flex-col justify-end sm:justify-center sm:items-center pointer-events-none p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full sm:max-w-[420px] bg-[#09090b] border border-white/15 rounded-t-[32px] sm:rounded-[28px] p-6 sm:p-7 shadow-[0_-20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.05)] pointer-events-auto relative overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >

              {/* Close Button */}
              <button 
                type="button"
                onClick={onClose}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-20 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Title */}
              <div className="w-full text-center mb-6 relative z-10 pt-1">
                <h2 className="text-3xl font-['Instrument_Serif',serif] font-normal text-white tracking-tight">
                  {step === "otp_verify" 
                    ? "Verify code" 
                    : step === "name_onboarding"
                    ? "Welcome to Council"
                    : mode === "signup" 
                    ? "Create an account" 
                    : "Welcome back"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1.5 px-4 leading-relaxed">
                  {customMessage || (
                    step === "otp_verify"
                      ? `Enter the 6-digit verification code sent to ${emailOrPhone}`
                      : step === "name_onboarding"
                      ? "Tell us how your fellow agents should address you"
                      : "Autonomous multi-agent consensus intelligence."
                  )}
                </p>
              </div>

              <div className="relative w-full min-h-[280px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  
                  {/* ── STAGE 1: Fast Social / Method Selector ── */}
                  {step === "select" && (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col flex-1"
                    >
                      <div className="space-y-2.5">
                        <button 
                          type="button"
                          onClick={() => handleSelectProvider("Google")} 
                          className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-3 hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-md cursor-pointer"
                        >
                          <GoogleIcon />
                          <span>Continue with Google</span>
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleSelectProvider("GitHub")} 
                          className="w-full py-3 px-4 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 active:scale-[0.98] text-white font-medium text-xs flex items-center justify-center gap-3 transition-all cursor-pointer"
                        >
                          <GithubIcon />
                          <span>Continue with GitHub</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] text-zinc-500 font-mono font-medium uppercase tracking-wider">OR</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      <div className="space-y-2.5">
                        <button 
                          type="button"
                          onClick={() => setStep("email_form")}
                          className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:scale-[0.98] text-white font-medium text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                        >
                          <Mail className="size-3.5 text-zinc-400" />
                          <span>Continue with Email</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* ── STAGE 2: Email & Password Form ── */}
                  {step === "email_form" && (
                    <motion.div
                      key="email_form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col flex-1"
                    >
                      <button 
                        type="button"
                        onClick={() => setStep("select")}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-3 transition-colors w-fit cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>

                      <form onSubmit={handleEmailPasswordSubmit} className="space-y-3 flex-1 flex flex-col">
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400 block mb-1">Email address</label>
                          <input 
                            type="email" 
                            value={emailOrPhone}
                            onChange={(e) => setEmailOrPhone(e.target.value)}
                            placeholder="you@domain.com" 
                            required
                            autoFocus
                            className="w-full bg-black/60 border border-white/15 focus:border-white/40 focus:bg-black rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-zinc-400 block mb-1">Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••" 
                              required
                              className="w-full bg-black/60 border border-white/15 focus:border-white/40 focus:bg-black rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all pr-10"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1"
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 mt-auto">
                          <button 
                            type="submit"
                            disabled={isSubmitting || !emailOrPhone.trim() || !password.trim()}
                            className="w-full py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Authenticating..." : mode === "signup" ? "Continue to Verification" : "Sign In"}
                            {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* ── STAGE 3: 6-Digit OTP Verification Screen ── */}
                  {step === "otp_verify" && (
                    <motion.div
                      key="otp_verify"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col flex-1"
                    >
                      <button 
                        type="button"
                        onClick={() => setStep("email_form")}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-2 transition-colors w-fit cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Change Email</span>
                      </button>

                      <form onSubmit={handleOtpSubmit} className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1.5 my-3">
                            {otpDigits.map((digit, idx) => (
                              <input
                                key={idx}
                                ref={(el) => { otpInputRefs.current[idx] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                autoFocus={idx === 0}
                                className="w-10 sm:w-11 h-12 text-center text-lg font-mono font-bold bg-black/80 border border-white/20 focus:border-white focus:shadow-[0_0_12px_rgba(255,255,255,0.3)] rounded-xl text-white outline-none transition-all"
                              />
                            ))}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 mt-1.5">
                            <span>Didn't receive code?</span>
                            {resendTimer > 0 ? (
                              <span className="font-mono text-zinc-500">Resend in {resendTimer}s</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setResendTimer(45)}
                                className="text-white underline hover:text-zinc-200 cursor-pointer"
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-3">
                          <button 
                            type="submit"
                            disabled={isSubmitting || otpDigits.join("").length < 6}
                            className="w-full py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Verifying..." : "Verify & Continue"}
                            {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* ── STAGE 4: Name Onboarding (New Signups) ── */}
                  {step === "name_onboarding" && (
                    <motion.div
                      key="name_onboarding"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="w-full flex flex-col flex-1"
                    >
                      <form onSubmit={handleNameSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400 block mb-1">Your Full Name</label>
                          <input 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Ujjwal Sharma" 
                            required
                            autoFocus
                            className="w-full bg-black/60 border border-white/15 focus:border-white/40 focus:bg-black rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                          />
                          <p className="text-[10px] text-zinc-500 mt-2">
                            This will appear in your deliberation reports and project session logs.
                          </p>
                        </div>

                        <div className="pt-3">
                          <button 
                            type="submit"
                            disabled={isSubmitting || !fullName.trim()}
                            className="w-full py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Creating profile..." : "Complete Setup"}
                            {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Mode Switch */}
              {step === "select" && (
                <div className="mt-5 text-center text-xs text-zinc-500 pt-3 border-t border-white/10">
                  {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                  <button 
                    type="button"
                    onClick={toggleMode} 
                    className="text-white font-medium hover:underline underline-offset-4 cursor-pointer ml-1"
                  >
                    {mode === "signup" ? "Log In" : "Sign Up"}
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
