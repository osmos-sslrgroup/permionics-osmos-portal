import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  ClipboardList, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  Monitor,
  Sun,
  Moon,
  FileEdit,
  Menu
} from "lucide-react";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoWhite from "@assets/logo_white.png";
import permionicsP from "@assets/permionics_P_exact_1783575144366.png";
import osmosLogo from "@assets/osmos_logo_blue_transparent.png";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  external?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/generator", label: "Generator", icon: FileText },
  { href: "/questionnaire", label: "Questionnaire", icon: ClipboardList },
  { href: "/pace", label: "PACE", icon: Monitor },
  { href: "/pace-formatter", label: "PACE Formatter", icon: FileEdit },
  { href: "/assistant", label: "Osmos AI", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      return saved !== null ? saved === "true" : false;
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleExpanded = (value: boolean) => {
    setExpanded(value);
    localStorage.setItem("sidebar-expanded", String(value));
  };

  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const { data: user } = useGetMe();

  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync(undefined);
    } catch (err) {
      console.warn("Backend logout failed", err);
    } finally {
      setLocation("~/login");
    }
  };

  const isActive = (href: string) => {
    if (typeof window === "undefined") return href === "/";
    const path = window.location.pathname;
    const base = import.meta.env.BASE_URL || "/";
    const absoluteLocation = (base !== "/" && path.startsWith(base))
      ? (path.slice(base.length - 1) || "/")
      : path;
    
    return href === "/" 
      ? absoluteLocation === "/" 
      : absoluteLocation === href || absoluteLocation.startsWith(`${href}/`);
  };

  const currentRole = (user as any)?.user?.role || "user";
  const visibleNavItems = navItems.filter((item) => {
    if (item.href === "/generator" && currentRole === "user") return false;
    return true;
  });

  const renderNavContent = (isExpanded: boolean, isMobileView: boolean) => (
    <div className="flex h-full flex-col">
      {/* Logo Area */}
      <div 
        className={`flex h-16 items-center border-b transition-all ${isExpanded ? "justify-start px-5" : "justify-center px-4"}`} 
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Link href="~/" onClick={() => isMobileView && setMobileOpen(false)}>
          <div className={`flex items-center cursor-pointer group justify-center w-full ${isExpanded ? "px-1" : ""}`}>
            {isExpanded ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between w-full select-none">
                <img src={logoWhite} alt="Permionics" className="h-7 w-auto object-contain flex-shrink-0" />
                <div className="h-4.5 w-px bg-white/10 mx-2 flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <img src={osmosLogo} alt="OSMOS" className="h-4 w-4 object-contain" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/60">OSMOS</span>
                </div>
              </motion.div>
            ) : (
              <img 
                src={permionicsP} 
                alt="P" 
                className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110" 
                style={{ filter: "brightness(0) invert(1)" }}
              />
            )}
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1.5 px-3 relative">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          const content = (
            <div className={`relative flex items-center h-10 w-full ${isExpanded ? "justify-start px-3" : "justify-center"} rounded-xl transition-colors duration-200 group z-10 ${active ? "text-white" : "text-white/60 hover:text-white"}`}>
              {active && (
                <motion.div
                  layoutId={isMobileView ? "mobileActiveIndicator" : "activeIndicator"}
                  className="absolute inset-0 bg-primary/20 rounded-xl z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                />
              )}
              {active && isExpanded && (
                <motion.div
                  layoutId={isMobileView ? "mobileActiveBorder" : "activeBorder"}
                  className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full z-0"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3 w-full">
                <Icon className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isExpanded ? "h-[18px] w-[18px]" : "h-5 w-5"}`} />
                {isExpanded && <span className="truncate text-[13px] font-medium">{item.label}</span>}
              </div>
            </div>
          );

          if (item.external) {
            return (
              <Tooltip key={item.href} delayDuration={isExpanded ? 1000 : 200}>
                <TooltipTrigger asChild>
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="block outline-none" onClick={() => isMobileView && setMobileOpen(false)}>
                    {content}
                  </a>
                </TooltipTrigger>
                {!isExpanded && <TooltipContent side="right" className="font-medium bg-slate-800 text-white border-slate-700">{item.label}</TooltipContent>}
              </Tooltip>
            );
          }

          return (
            <Tooltip key={item.href} delayDuration={isExpanded ? 1000 : 200}>
              <TooltipTrigger asChild>
                <Link href={`~${item.href}`} className="block outline-none" onClick={() => isMobileView && setMobileOpen(false)}>
                  {content}
                </Link>
              </TooltipTrigger>
              {!isExpanded && <TooltipContent side="right" className="font-medium bg-slate-800 text-white border-slate-700">{item.label}</TooltipContent>}
            </Tooltip>
          );
        })}
      </nav>

      {/* User + Controls */}
      <div className="border-t p-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        {isExpanded ? (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
              {user && (
                <div className="px-3 py-2.5 rounded-xl flex items-center gap-3 bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-inner">
                    {((user as any)?.user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/90 truncate">{(user as any)?.user?.email ?? "User"}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">{currentRole}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl h-9 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all border-0 cursor-pointer bg-white/5"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={theme}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </motion.div>
                  </AnimatePresence>
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-red-500/20 transition-all border-0 cursor-pointer bg-white/5 group"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col gap-2 items-center">
            {user && (
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-inner cursor-default mb-1">
                    {((user as any)?.user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{(user as any)?.user?.email}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all border-0 cursor-pointer"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={theme}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:text-white hover:bg-red-500/20 transition-all border-0 cursor-pointer group"
                >
                  <LogOut className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        {!isMobileView && (
          <button
            onClick={() => toggleExpanded(!isExpanded)}
            className={`mt-2 flex items-center ${isExpanded ? "justify-end pr-3" : "justify-center"} w-full h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all border-0 cursor-pointer`}
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
              <ChevronRight className="h-5 w-5" />
            </motion.div>
          </button>
        )}
      </div>
    </div>
  );

  // Mobile Render
  if (isMobile) {
    return (
      <>
        {/* Mobile Header trigger */}
        <div className="fixed top-4 left-4 z-50 print-hide">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="w-10 h-10 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r-0 glass text-white" style={{ background: "hsl(var(--sidebar))" }}>
              {renderNavContent(true, true)}
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop Render
  return (
    <motion.div
      className="h-screen flex-shrink-0 print-hide z-30"
      initial={false}
      animate={{ width: expanded ? 250 : 80 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      style={{ background: "hsl(222 47% 9%)" }}
    >
      {renderNavContent(expanded, false)}
    </motion.div>
  );
}
