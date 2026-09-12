import { useLocation } from "wouter";
import { Monitor, ArrowLeft, Mail, Cpu, Zap, Activity, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PacePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center p-6 md:p-12 bg-slate-950/5 relative overflow-hidden text-foreground">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10 animate-fade-in">
        {/* PACE Engine Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          PACE Engine · v2.0 Under Development
        </div>

        {/* Header Title & Description */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Permionics Analytics &amp; Calculation Engine
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            The PACE projection suite is currently being integrated into the Osmos BD Hub. High-precision RO, NF, UF, and MBR membrane simulations will be available directly in your browser soon.
          </p>
        </div>

        {/* Feature Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-foreground">Flux &amp; Recovery Math</h3>
            <p className="text-[11px] text-muted-foreground leading-normal">Automated stage-by-stage osmotic pressure and flux balance calculations.</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-bold text-foreground">Membrane Projections</h3>
            <p className="text-[11px] text-muted-foreground leading-normal">Spiral wound and tubular membrane array sizing algorithms.</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-foreground">Client Proposal Sync</h3>
            <p className="text-[11px] text-muted-foreground leading-normal">Direct export into Case Study Generator and technical questionnaires.</p>
          </div>
        </div>

        {/* Support & Contact Callout */}
        <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
              <Mail className="w-4 h-4" />
              Need Immediate Projections or Calculation Support?
            </div>
            <p className="text-xs text-slate-300">
              Contact our senior engineering team for manual PACE calculations:
            </p>
          </div>
          <a
            href="mailto:saikiran@permionics.com?subject=PACE%20Calculation%20Request"
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            saikiran@permionics.com
          </a>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="rounded-xl px-6 font-semibold text-xs gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
