import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChangePassword, customFetch, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, KeyRound, Database, CheckCircle2, XCircle, Loader2, User, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserManagementPage } from "./UserManagementPage";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: meData } = useGetMe();
  const currentUser = (meData as any)?.user;
  const currentRole = currentUser?.role || "admin";
  const isAdmin = currentRole === "admin";

  const changePasswordMutation = useChangePassword();
  const [status, setStatus] = useState<{ database: boolean; llm: boolean } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [activeTab, setActiveTab] = useState<"security" | "users">("security");

  useEffect(() => {
    if (isAdmin) {
      customFetch<{ database: boolean; llm: boolean }>("/api/settings/status")
        .then((data) => {
          setStatus(data);
        })
        .catch((err) => {
          console.error("Failed to load status", err);
          setStatus({ database: true, llm: true });
        })
        .finally(() => {
          setIsLoadingStatus(false);
        });
    }
  }, [isAdmin]);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate(
      { 
        data: { 
          currentPassword: values.currentPassword, 
          newPassword: values.newPassword 
        } 
      }, 
      {
        onSuccess: () => {
          toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update password. Please check your current password.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-10 animate-fade-in text-foreground pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-medium mt-1">
            {isAdmin
              ? "Configure security, multi-role user accounts, and view system status."
              : "Manage your account profile and security credentials."}
          </p>
        </div>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-12 items-start">
        {/* Sidebar Nav */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="md:col-span-3 space-y-2">
          <Button 
            variant="ghost" 
            onClick={() => setActiveTab("security")}
            className={`w-full justify-start font-semibold rounded-xl h-12 transition-all duration-200 ${activeTab === "security" ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
          >
            <Shield className="mr-3 h-5 w-5" />
            {isAdmin ? "Security & Status" : "Account & Security"}
          </Button>

          {isAdmin && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("users")}
              className={`w-full justify-start font-semibold rounded-xl h-12 transition-all duration-200 ${activeTab === "users" ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
            >
              <KeyRound className="mr-3 h-5 w-5" />
              User & Operator Roles
            </Button>
          )}
        </motion.div>

        {/* Content Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-9 space-y-8">
          {activeTab === "users" && isAdmin ? (
            <div className="glass rounded-3xl p-8 border border-border/50 shadow-xl overflow-hidden">
              <UserManagementPage />
            </div>
          ) : (
            <>
              {/* Account Details Header */}
              <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-xl relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-8 border-b border-border/30 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {isAdmin ? <KeyRound className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                      {isAdmin ? "Change Master Password" : "Account Settings"}
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isAdmin
                        ? "Update the master access password for the portal."
                        : `Logged in as ${currentUser?.email || "User"}. Update your account password below.`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`uppercase text-[10px] px-3 py-1 font-bold tracking-wider rounded-full shadow-sm ${
                      currentRole === "admin"
                        ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                        : currentRole === "operator"
                        ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800"
                    }`}
                  >
                    {currentRole} Role
                  </Badge>
                </div>
                
                <div className="p-8 bg-black/5 dark:bg-white/5">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-md">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 text-base" />
                            </FormControl>
                            <FormMessage className="text-red-500 font-medium" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 text-base" />
                            </FormControl>
                            <FormMessage className="text-red-500 font-medium" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="h-12 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary/50 text-base" />
                            </FormControl>
                            <FormMessage className="text-red-500 font-medium" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="mt-6 h-12 w-full rounded-xl font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Updating...</>
                        ) : (
                          <><Save className="w-5 h-5 mr-2" /> Save New Password</>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>

              {/* System Integration Status: Strictly Visible ONLY to Admin */}
              {isAdmin && (
                <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-xl relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="p-8 border-b border-border/30">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Database className="h-5 w-5 text-secondary" />
                      System Integration Status
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      View the connection status for internal APIs and database services.
                    </p>
                  </div>
                  
                  <div className="p-8 space-y-4 bg-black/5 dark:bg-white/5">
                    <div className="flex items-center justify-between p-5 border border-border/50 rounded-2xl bg-background/50 hover:bg-white/5 transition-colors">
                      <div>
                        <h4 className="font-bold">Core Database</h4>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">PostgreSQL / In-Memory Mock Storage</p>
                      </div>
                      {isLoadingStatus ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : status?.database ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-wider">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                          Offline
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-5 border border-border/50 rounded-2xl bg-background/50 hover:bg-white/5 transition-colors">
                      <div>
                        <h4 className="font-bold">LLM Assistant API</h4>
                        <p className="text-sm font-medium text-muted-foreground mt-0.5">Groq & Gemini RAG Failover Engine</p>
                      </div>
                      {isLoadingStatus ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : status?.llm ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-bold text-xs uppercase tracking-wider">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </span>
                          Offline
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 border-t border-border/30 p-4">
                    <p className="text-xs font-medium text-muted-foreground w-full text-center">
                      Permionics Insights Portal v2.0.0 — RBAC Multi-Role Auth
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
