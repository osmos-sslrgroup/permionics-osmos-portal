import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { OsmosChat } from "../OsmosChat";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

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
      <main className="flex-1 overflow-y-auto print-full relative bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key={absoluteLocation}
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      {/* OSMOS floating chat — visible only on dashboard */}
      {showFloatingChat && <OsmosChat />}
    </div>
  );
}
