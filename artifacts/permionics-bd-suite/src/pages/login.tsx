import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { customFetch, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, User, ArrowRight } from "lucide-react";
import osmosLogo from "@assets/osmos_logo_blue_transparent.png";
import permionicsLogo from "@assets/permionics_logo_blue.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading: meLoading } = useGetMe();

  const [mode, setMode] = useState<"login" | "signup">("login");
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
      <div className="flex h-screen w-full items-center justify-center" style={{ background: "hsl(222 47% 6%)" }}>
        <div
          className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "hsl(217 91% 60% / 0.3)", borderTopColor: "hsl(217 91% 60%)" }}
        />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsSubmitting(true);

    try {
      const res = await customFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email ? email.trim() : undefined, password, remember: true }),
      });

      if (res.authenticated) {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.remove("dark");
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      } else {
        toast({
          title: "Access Denied",
          description: res.error || "Invalid login credentials.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Access Denied",
        description: err.message || "Invalid password or email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);

    try {
      const res = await customFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (res.authenticated) {
        toast({
          title: "Account Created",
          description: "Welcome to Osmos Insights Portal! You have read-only access to case studies.",
        });
        await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      } else {
        toast({
          title: "Registration Failed",
          description: res.error || "Failed to create account.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "An account with this email may already exist.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleOAuth = () => {
    toast({
      title: "Google OAuth Sign-In",
      description: "Google Sign-In requires your Firebase API key in .env (FIREBASE_API_KEY).",
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-slate-950 p-4 lg:p-6 select-none justify-center items-center gap-6 lg:gap-8">
      {/* ── Background: Deep navy gradient ── */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

      {/* ── Left Side: Embedded Login/Signup Card ── */}
      <div className="relative z-10 flex flex-col justify-between w-full lg:w-[42%] bg-white p-6 lg:p-10 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] border border-slate-100/10 min-h-[520px] lg:h-[calc(100vh-80px)] max-h-[700px] overflow-y-auto">
        {/* Top: Co-branded Header */}
        <div className="relative z-10 flex flex-col gap-3 justify-center lg:justify-start items-center lg:items-start select-none">
          <img src={permionicsLogo} alt="Permionics Logo" className="h-12 w-auto object-contain" />
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Insights Portal powered by</span>
            <img src={osmosLogo} alt="OSMOS" className="h-4.5 w-4.5 object-contain" />
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-600">OSMOS</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex w-full bg-slate-100 p-1 rounded-lg my-4">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In (Admin / Operator / User)
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
              mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            New User Registration
          </button>
        </div>

        {/* Center: Form */}
        <div className="relative z-10 w-full max-w-[340px] mx-auto py-2">
          <div className="mb-4 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {mode === "login" ? "Welcome Back" : "Create User Account"}
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {mode === "login" ? "Log in to start using the Osmos Portal" : "Sign up for public view & download access"}
            </p>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-10 rounded-lg border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                {mode === "signup" ? "Email Address" : "Email (Optional for Admin Password)"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-10 rounded-lg border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-10 rounded-lg border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg, hsl(222 71% 18%), hsl(217 91% 28%))",
                color: "white",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Authenticating..."
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Register Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Social Google OAuth Divider */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGoogleOAuth}
              className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign in with Google (Firebase)
            </button>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-2">
          Roles: Admin (Full) | Operator (Create/Edit) | User (View/Download)
        </p>
      </div>

      {/* ── Right Side: Branding Panel ── */}
      <div className="relative z-10 flex flex-col justify-between w-full lg:w-[54%] p-8 lg:p-12 text-white rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-indigo-500/10 min-h-[38vh] lg:h-[calc(100vh-80px)] max-h-[700px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none z-0" />
        <div className="z-10 flex items-center gap-2 w-max px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          OSMOS INTELLIGENCE
        </div>
        <div className="my-auto space-y-6 z-10">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Search Smarter.<br />Extract Faster.<br />Create Anywhere.
          </h1>
          <p className="text-sm text-white/50 max-w-md leading-relaxed">
            Advanced Knowledge Platform for Permionics Membranes — featuring 3-Tier Multi-Role access.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["Case Study Library", "Osmos AI", "Smart Generator", "Questionnaire Engine", "Role Management"].map((f) => (
              <span key={f} className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70">
                {f}
              </span>
            ))}
          </div>
        </div>
        <p className="hidden lg:block text-xs text-white/30 z-10">© 2026 Permionics Membranes Pvt. Ltd.</p>
      </div>
    </div>
  );
}
