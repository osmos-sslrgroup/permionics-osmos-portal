import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { customFetch, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, User, ArrowRight, ShieldCheck, Zap, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import osmosLogo from "@assets/osmos_logo_blue_transparent.png";
import permionicsLogo from "@assets/permionics_logo_blue.png";

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading: meLoading } = useGetMe();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.authenticated) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (meLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin border-primary/30 border-t-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken(true);

      const res = (await customFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ idToken, remember: true }),
      })) as any;

      if (res.authenticated) {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.remove("dark");
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        
        if (res.needsReset) {
          setLocation("/reset-password");
        } else {
          setLocation("/");
        }
      } else {
        toast({ title: "Access Denied", description: res.error || "Invalid login credentials.", variant: "destructive" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Access Denied", description: "Invalid email or password.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);

    try {
      const res = (await customFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })) as any;

      if (res.authenticated) {
        toast({ title: "Account Created", description: "Welcome to Osmos Insights Portal!" });
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      } else {
        toast({ title: "Registration Failed", description: res.error || "Failed to create account.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message || "An account with this email may already exist.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email to reset your password.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast({ title: "Email Sent", description: "Check your inbox for password reset instructions." });
      setMode("login");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send reset email.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = async () => {
    if (!auth) {
      toast({
        title: "Firebase Auth Error",
        description: "Firebase is not configured. Please ensure VITE_FIREBASE_* variables are set.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken(true);

      const res = (await customFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ idToken, remember: true }),
      })) as any;

      if (res.authenticated) {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.remove("dark");
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        
        if (res.needsReset) {
          setLocation("/reset-password");
        } else {
          setLocation("/");
        }
      } else {
        toast({ title: "Access Denied", description: res.error || "Login failed.", variant: "destructive" });
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("Google Sign-In error:", err);
        toast({ title: "Google Sign-In Failed", description: err.message || "Failed to sign in with Google.", variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stagger animation variants
  const containerVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: import("framer-motion").Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-slate-950 p-4 lg:p-8 select-none justify-center items-center gap-6 lg:gap-10">
      {/* ── Background: Animated Gradient ── */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-blue-950">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-60 mix-blend-screen" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-60 mix-blend-screen" />
      </div>

      {/* ── Left Side: Form Panel ── */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col justify-between w-full lg:w-[45%] glass p-8 lg:p-12 rounded-3xl shadow-2xl border border-white/20 min-h-[520px] lg:h-[calc(100vh-120px)] max-h-[750px] overflow-y-auto bg-white/95 dark:bg-black/80 backdrop-blur-xl"
      >
        {/* Top: Co-branded Header */}
        <div className="relative z-10 flex flex-col gap-4 justify-center lg:justify-start items-center lg:items-start select-none">
          <img src={permionicsLogo} alt="Permionics Logo" className="h-10 lg:h-12 w-auto object-contain drop-shadow-sm" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Powered by</span>
            <img src={osmosLogo} alt="OSMOS" className="h-4 w-4 object-contain" />
            <span className="text-[11px] font-black tracking-widest uppercase text-foreground/80">OSMOS</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex w-full bg-muted/40 p-1.5 rounded-2xl my-8 shadow-inner border border-border/50">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Register
          </button>
        </div>

        {/* Center: Form */}
        <div className="relative z-10 w-full max-w-[380px] mx-auto py-2 flex-1 flex flex-col justify-center">
          <motion.div 
            key={mode} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 text-center lg:text-left"
          >
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 font-medium">
              {mode === "login" ? "Log in to access the Insights Portal" : mode === "signup" ? "Sign up for public view & download access" : "Enter your email to receive a reset link"}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={mode}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              onSubmit={mode === "login" ? handleLogin : mode === "signup" ? handleSignup : handleForgotPassword} 
              className="space-y-5"
            >
              {mode === "signup" && (
                <motion.div variants={itemVariants}>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-11 bg-background/50 backdrop-blur-sm shadow-inner"
                    />
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 bg-background/50 backdrop-blur-sm shadow-inner"
                  />
                </div>
              </motion.div>

              {mode !== "forgot" && (
                <motion.div variants={itemVariants}>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 bg-background/50 backdrop-blur-sm shadow-inner"
                      required
                    />
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : mode === "signup" ? "Register Account" : "Send Reset Link"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
              
              {mode === "forgot" && (
                <motion.div variants={itemVariants} className="text-center mt-4">
                  <button type="button" onClick={() => setMode("login")} className="text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors">
                    Back to Login
                  </button>
                </motion.div>
              )}

              {/* Social Google OAuth Divider */}
              {mode !== "forgot" && (
                <motion.div variants={itemVariants} className="mt-6 pt-5 border-t border-border/50">
                  <button
                    type="button"
                    onClick={handleGoogleOAuth}
                    className="w-full h-11 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/50 text-foreground text-xs font-bold flex items-center justify-center gap-3 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>
                </motion.div>
              )}
            </motion.form>
          </AnimatePresence>
        </div>

        <div className="flex justify-center items-center gap-4 mt-6 pt-4 text-muted-foreground">
           <div className="flex items-center gap-1.5 text-[10px] font-bold"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Admin</div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold"><Zap className="w-3.5 h-3.5 text-amber-500" /> Operator</div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold"><Key className="w-3.5 h-3.5 text-blue-500" /> User</div>
        </div>
      </motion.div>

      {/* ── Right Side: Branding Panel ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex flex-col justify-between w-full lg:w-[50%] p-8 lg:p-16 text-white rounded-3xl shadow-2xl border border-white/10 min-h-[38vh] lg:h-[calc(100vh-120px)] max-h-[750px] overflow-hidden bg-white/5 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
        
        <div className="z-10 flex items-center gap-2 w-max px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-wider text-blue-200 shadow-lg backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          OSMOS INTELLIGENCE
        </div>
        
        <div className="my-auto space-y-8 z-10">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-blue-200 drop-shadow-sm">
            Search Smarter.<br />Extract Faster.<br />Create Anywhere.
          </h1>
          <p className="text-base lg:text-lg text-blue-100/70 max-w-lg leading-relaxed font-medium">
            The advanced knowledge platform for Permionics Membranes — featuring multi-tier access and an AI-powered BD Assistant.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-4">
            {["Case Study Library", "Osmos AI", "Smart Generator", "Questionnaires", "PACE Integration"].map((f) => (
              <span key={f} className="text-xs font-bold px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/90 shadow-sm backdrop-blur-md">
                {f}
              </span>
            ))}
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-white/40 z-10">
          <div className="w-8 h-px bg-white/20" />
          © 2026 Permionics Membranes Pvt. Ltd.
        </div>
      </motion.div>
    </div>
  );
}
