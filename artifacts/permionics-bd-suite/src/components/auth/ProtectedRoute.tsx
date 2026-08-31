import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
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
          <p className="text-sm font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!data?.authenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
