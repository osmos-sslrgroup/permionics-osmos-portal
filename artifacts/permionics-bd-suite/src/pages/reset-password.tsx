import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { customFetch } from "@workspace/api-client-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;
    if (password !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }

    if (!auth.currentUser) {
      toast({ title: "Error", description: "Session expired. Please log in again.", variant: "destructive" });
      setLocation("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update password in Firebase Auth
      await updatePassword(auth.currentUser, password);

      // Clear the needs_password_reset flag in our Supabase DB
      await customFetch("/api/auth/reset-flag", {
        method: "POST"
      });

      toast({ title: "Success", description: "Password updated successfully. You can now use the portal." });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update password.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 select-none">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
      <div className="relative z-10 w-full max-w-md bg-white p-8 rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] border border-slate-100/10">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Reset Required
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Your account was created by an administrator. For security reasons, you must set a new password before proceeding.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-10 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                required
                minLength={6}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-10 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-semibold focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-lg text-xs font-bold mt-2 transition-all"
            style={{ background: "linear-gradient(135deg, hsl(222 71% 18%), hsl(217 91% 28%))", color: "white" }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Password & Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
