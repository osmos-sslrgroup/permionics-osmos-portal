import { useState } from "react";
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
} from "lucide-react";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import logoWhite from "@assets/logo_white.png";
import permionicsP from "@assets/permionics_P_exact_1783575144366.png";
import osmosLogo from "@assets/osmos_logo_blue_transparent.png";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/generator", label: "Generator", icon: FileText },
  { href: "/questionnaire", label: "Questionnaire", icon: ClipboardList },
  { href: "https://pace-permionics.up.railway.app/index.html", label: "PACE", icon: Monitor, external: true },
  { href: "/assistant", label: "Osmos AI", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-expanded");
      return saved !== null ? saved === "true" : false; // default: collapsed
    }
    return false;
  });

  const toggleExpanded = (value: boolean) => {
    setExpanded(value);
    localStorage.setItem("sidebar-expanded", String(value));
  };
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const { toast } = useToast();
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
      console.warn("Backend logout request failed/unauthorized, proceeding with local clear", err);
    } finally {
      setLocation("/login");
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

  return (
    <div
      className={`sidebar-transition flex h-screen flex-col print-hide flex-shrink-0 relative ${
        expanded ? "w-56" : "w-[72px]"
      }`}
      style={{ background: "hsl(var(--sidebar))" }}
    >
      {/* Logo */}
      <div 
        className={`flex h-16 items-center border-b transition-all ${expanded ? "justify-start px-5" : "justify-center px-4"}`} 
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <Link href="~/">
          <div className={`flex items-center cursor-pointer group justify-center w-full ${expanded ? "px-1" : ""}`}>
            {expanded ? (
              <div className="flex items-center justify-between w-full select-none">
                {/* Permionics logo (increased size) */}
                <img src={logoWhite} alt="Permionics" className="h-7 w-auto object-contain flex-shrink-0" />
                
                {/* Dim straight vertical divider line */}
                <div className="h-4.5 w-px bg-white/10 mx-2 flex-shrink-0" />
                
                {/* OSMOS logo and name */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <img src={osmosLogo} alt="OSMOS" className="h-4 w-4 object-contain" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/60">OSMOS</span>
                </div>
              </div>
            ) : (
              <img 
                src={permionicsP} 
                alt="P" 
                className="h-8 w-8 object-contain transition-all duration-200" 
                style={{ filter: "brightness(0) invert(1)" }}
              />
            )}
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.external) {
            return expanded ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white/60 hover:text-white hover:bg-white/8 cursor-pointer"
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            ) : (
              <Tooltip key={item.href} delayDuration={200}>
                <TooltipTrigger asChild>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full h-10 rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/8 cursor-pointer"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return expanded ? (
            <Link
              key={item.href}
              href={`~${item.href}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "text-white"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
              style={active ? {
                background: "linear-gradient(90deg, hsl(217 91% 60% / 0.25), hsl(217 91% 60% / 0.08))",
                boxShadow: "inset 3px 0 0 hsl(217 91% 60%)",
                paddingLeft: "10px",
              } : {}}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ) : (
            <Tooltip key={item.href} delayDuration={200}>
              <TooltipTrigger asChild>
                <Link
                  href={`~${item.href}`}
                  className={`flex items-center justify-center w-full h-10 rounded-xl transition-all ${
                    active
                      ? "text-white"
                      : "text-white/50 hover:text-white hover:bg-white/8"
                  }`}
                  style={active ? {
                    background: "hsl(217 91% 60% / 0.2)",
                    boxShadow: "0 0 0 1px hsl(217 91% 60% / 0.4)",
                  } : {}}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t p-2 space-y-1" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        {expanded ? (
          <>
            {user && (
              <div className="px-3 py-2 rounded-xl mb-1" style={{ background: "hsl(var(--sidebar-accent))" }}>
                <p className="text-xs font-semibold text-white/80 truncate">
                  {(user as any)?.email ?? "Admin"}
                </p>
                <p className="text-[10px] text-white/40">Permionics Insights Portal</p>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all border-0 cursor-pointer"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-[18px] w-[18px] flex-shrink-0" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-[18px] w-[18px] flex-shrink-0" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all border-0 cursor-pointer"
            >
              <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-full h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all border-0 cursor-pointer"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{theme === "dark" ? "Light Mode" : "Dark Mode"}</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center w-full h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all border-0 cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </>
        )}

        {/* Collapse toggle */}
        {expanded ? (
          <button
            onClick={() => toggleExpanded(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white hover:bg-white/8 transition-all border-0 cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronRight className="h-[18px] w-[18px] flex-shrink-0 rotate-180" />
            <span>Collapse</span>
          </button>
        ) : (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => toggleExpanded(true)}
                className="flex items-center justify-center w-full h-10 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-all border-0 cursor-pointer"
                title="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
