import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Lock, ArrowRight } from "lucide-react";
import osmosLogo from "@assets/osmos_logo_blue_transparent.png";
import permionicsLogo from "@assets/permionics_logo_blue.png";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  const { data: user, isLoading: meLoading } = useGetMe();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" },
  });



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

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      { data: { password: values.password } },
      {
        onSuccess: async (res) => {
          if (res.authenticated) {
            // Force light mode by default on login
            localStorage.setItem("theme", "light");
            document.documentElement.classList.remove("dark");
            
            await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            setLocation("/");
          } else {
            toast({
              title: "Access Denied",
              description: "Invalid password. Please try again.",
              variant: "destructive",
            });
            form.setError("password", { message: "Incorrect password" });
          }
        },
        onError: () => {
          toast({
            title: "Access Denied",
            description: "Invalid password. Please try again.",
            variant: "destructive",
          });
          form.setError("password", { message: "Incorrect password" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative overflow-hidden bg-slate-950 p-4 lg:p-6 select-none justify-center items-center gap-6 lg:gap-8">
      {/* ── Background: Deep navy gradient ── */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

      {/* ── Left Side: Embedded Login Card (Solid white, squarish/rounded-xl, reduced height) ── */}
      <div 
        className="relative z-10 flex flex-col justify-between w-full lg:w-[40%] bg-white p-6 lg:p-10 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] border border-slate-100/10 min-h-[480px] lg:h-[calc(100vh-80px)] max-h-[660px]"
      >
        {/* Top: Dope Co-branded Header Layout (Bolder Sizing) */}
        <div className="relative z-10 flex flex-col gap-3 justify-center lg:justify-start items-center lg:items-start select-none">
          <img src={permionicsLogo} alt="Permionics Logo" className="h-14 w-auto object-contain" />
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Insights Portal powered by</span>
            <img src={osmosLogo} alt="OSMOS" className="h-4.5 w-4.5 object-contain" />
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-600">OSMOS</span>
          </div>
        </div>

        {/* Subtle Header Divider Line */}
        <div className="w-full h-px bg-slate-100 mt-5 mb-2 pointer-events-none" />

        {/* Center: Login Form */}
        <div className="relative z-10 my-auto w-full max-w-[320px] mx-auto py-6 lg:py-0">
          {/* Access Pill Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/40 w-fit mb-3.5 mx-auto lg:mx-0 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Secure Gateway</span>
          </div>

          {/* Card Heading */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Welcome Back</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Log in to start using the Osmos Portal</p>
          </div>
          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 select-none">
                        Access Password
                      </label>
                      <FormControl>
                        <div className="relative">
                          <Lock
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                          />
                          <Input
                            type="password"
                            placeholder="Enter portal password"
                            className="pl-10 h-12 rounded-xl border border-slate-200 text-sm font-semibold transition-all duration-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                            style={{
                              background: "hsl(220 15% 97%)",
                              color: "hsl(222 47% 11%)",
                            }}
                            autoComplete="current-password"
                            autoFocus
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed select-none">
                        Enter your security access key to authenticate.
                      </p>
                    </div>
                    <FormMessage className="text-xs mt-1" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:gap-2.5"
                style={{
                  background: "linear-gradient(135deg, hsl(222 71% 18%), hsl(217 91% 28%))",
                  color: "white",
                  boxShadow: "0 4px 14px hsl(222 71% 17% / 0.25)",
                }}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating…
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Bottom: Footer Info */}
        <p className="text-[10px] text-center text-slate-400 mt-4">
          Authorized personnel only
        </p>
      </div>

      {/* ── Right Side: Layered Navy Branding Card (Squarish/rounded-xl, reduced height) ── */}
      <div 
        className="relative z-10 flex flex-col justify-between w-full lg:w-[56%] p-8 lg:p-12 text-white rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] border border-indigo-500/10 min-h-[38vh] lg:h-[calc(100vh-80px)] max-h-[660px] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80"
      >
        {/* Subtle Tech-Grid Background Layer (Brightened for high visibility on dark background) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none z-0" />
        
        {/* Glow blob */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none z-0" />

        {/* Top: Small badge label */}
        <div className="z-10 flex items-center gap-2 w-max px-3 py-1 rounded-full bg-white/5 border border-white/10 select-none text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          OSMOS INTELLIGENCE
        </div>

        {/* Center: Bolder Heading */}
        <div className="my-auto space-y-6 z-10">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Search Smarter.<br />Extract Faster.<br />Create Anywhere.
          </h1>
          <p className="text-sm lg:text-base text-white/50 max-w-md leading-relaxed">
            Advanced Knowledge Platform for Permionics Membranes - powering smarter business development with AI.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2 pt-4">
            {["Case Study Library", "Osmos AI", "Smart Generator", "Questionnaire Engine"].map(f => (
              <span
                key={f}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 backdrop-blur-sm shadow-sm hover:bg-white/10 hover:text-white transition-all duration-200 cursor-default"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom footer text for desktop */}
        <p className="hidden lg:block text-xs text-white/30 z-10">
          © 2026 Permionics Membranes Pvt. Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
