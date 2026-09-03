import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "operator" | "user")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useGetMe({ 
    query: { 
      retry: false,
      queryKey: getGetMeQueryKey()
    } 
  });

  useEffect(() => {
    if (!isLoading && (!data || !data.authenticated)) {
      setLocation("/login");
    }
  }, [data, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-muted-foreground flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!data?.authenticated) {
    return null;
  }

  // Check role restrictions if specified
  const currentRole = (data as any).user?.role || "admin";
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md text-center bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-foreground">Access Restricted</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Your account ({currentRole.toUpperCase()}) does not have permission to access this page. Required role: {allowedRoles.join(" or ").toUpperCase()}.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
