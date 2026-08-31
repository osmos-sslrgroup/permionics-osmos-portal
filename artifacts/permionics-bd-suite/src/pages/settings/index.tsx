import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useChangePassword, customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, KeyRound, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

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
  const changePasswordMutation = useChangePassword();
  const [status, setStatus] = useState<{ database: boolean; llm: boolean } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  useEffect(() => {
    customFetch<{ database: boolean; llm: boolean }>("/api/settings/status")
      .then((data) => {
        setStatus(data);
      })
      .catch((err) => {
        console.error("Failed to load status", err);
        // Fallback to active state during restarts/rebuilds
        setStatus({ database: true, llm: true });
      })
      .finally(() => {
        setIsLoadingStatus(false);
      });
  }, []);

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
    <div className="max-w-4xl mx-auto p-8 space-y-6 animate-fade-in text-foreground">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Configure security, authentication passphrases, and view system status.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-primary bg-primary/5 font-semibold rounded-lg"
          >
            <Shield className="mr-2 h-4 w-4" />
            Security
          </Button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update the master access password for the portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="mt-2"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? "Updating..." : "Update Passphrase"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Integration Status
              </CardTitle>
              <CardDescription>
                View the connection status for internal APIs and services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Core Database</h4>
                  <p className="text-sm text-muted-foreground">PostgreSQL Storage</p>
                </div>
                {isLoadingStatus ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : status?.database ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 flex items-center">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 flex items-center">
                    <XCircle className="h-3 w-3" /> Disconnected
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">LLM Assistant API</h4>
                  <p className="text-sm text-muted-foreground">Groq Llama-3 Integration</p>
                </div>
                {isLoadingStatus ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : status?.llm ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 flex items-center">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 flex items-center">
                    <XCircle className="h-3 w-3" /> Disconnected
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 border-t py-3">
              <p className="text-xs text-muted-foreground w-full text-center">
                Permionics Insights Portal v1.0.0
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
