import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { OsmosChat } from "../OsmosChat";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const absolutePath = typeof window !== "undefined" ? window.location.pathname : "/";
  const base = import.meta.env.BASE_URL || "/";
  const absoluteLocation = (base !== "/" && absolutePath.startsWith(base))
    ? (absolutePath.slice(base.length - 1) || "/")
    : absolutePath;

  const showFloatingChat = absoluteLocation === "/";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto print-full">
        {children}
      </main>
      {/* OSMOS floating chat — visible only on dashboard */}
      {showFloatingChat && <OsmosChat />}
    </div>
  );
}
