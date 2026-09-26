import { useGetDashboardStats, useListCaseStudies, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Briefcase,
  ClipboardList,
  MapPin,
  Clock,
  Plus,
  FileText,
  Activity,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { motion } from "framer-motion";

const CHART_COLORS = ["#1e40af", "#3b82f6", "#0ea5e9", "#06b6d4", "#6366f1", "#8b5cf6"];

function getSectorColor(sector: string) {
  const s = sector.toLowerCase();
  if (s.includes("pharma") || s.includes("herbal"))
    return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
  if (s.includes("textile"))
    return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800";
  if (s.includes("cetp") || s.includes("municipal"))
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
  if (s.includes("food") || s.includes("beverage"))
    return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
  return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: any;
  accent: string;
  sublabel?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative rounded-2xl p-6 overflow-hidden glass group cursor-default transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      style={{
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer z-0" />

      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-10"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs mt-1.5 text-muted-foreground font-medium">
              {sublabel}
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}
        >
          <Icon className="w-6 h-6" style={{ color: accent }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────────
function ActionBtn({ href, icon: Icon, label, accent }: { href: string; icon: any; label: string; accent: string }) {
  return (
    <Link href={href}>
      <button
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.99]"
        style={{
          background: accent,
          color: "white",
          boxShadow: `0 4px 14px color-mix(in srgb, ${accent} 40%, transparent)`,
        }}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, isError } = useGetDashboardStats();
  const { data: caseStudiesRes, isLoading: csLoading } = useListCaseStudies();
  const { data: userData } = useGetMe();

  const userRole = (userData as any)?.user?.role || "user";
  const canManage = userRole === "admin" || userRole === "operator";
  const isLoading = statsLoading || csLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-40 rounded-xl animate-pulse glass" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse glass" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-8">
        <div
          className="rounded-2xl p-6 glass border-amber-200/30"
          style={{ background: "hsl(var(--warning) / 0.1)" }}
        >
          <p className="font-bold text-amber-500 mb-1">Database setup required</p>
          <p className="text-sm text-amber-500/80">
            Run the <code className="bg-amber-500/20 px-1 rounded">supabase-migration.sql</code> in your Supabase SQL editor to create the required tables.
          </p>
        </div>
      </div>
    );
  }

  // Compute sector breakdown percentages on the client side dynamically
  const caseStudies = caseStudiesRes ?? [];
  const sectorCounts: Record<string, number> = {};
  let totalSectors = 0;
  caseStudies.forEach((cs: any) => {
    if (cs.sector) {
      sectorCounts[cs.sector] = (sectorCounts[cs.sector] || 0) + 1;
      totalSectors++;
    }
  });

  const computedBreakdown = Object.entries(sectorCounts).map(([name, count]) => ({
    name,
    value: totalSectors > 0 ? Math.round((count / totalSectors) * 100) : 0,
  })).sort((a, b) => b.value - a.value);

  const sectorData = (computedBreakdown.length > 0
    ? computedBreakdown
    : [
        { name: "Pharma/Herbal", value: 35 },
        { name: "Textile", value: 25 },
        { name: "CETP/Municipal", value: 20 },
        { name: "Food & Beverage", value: 20 },
      ]) as { name: string; value: number }[];

  const lastUpdatedStr = stats.lastUpdated
    ? format(new Date(stats.lastUpdated), "MMM d, yyyy")
    : "N/A";

  return (
    <div className="min-h-full text-foreground pb-12">
      {/* ── Top header bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-8 h-20 print-hide glass"
        style={{
          borderBottom: "1px solid var(--glass-border)",
          borderRadius: 0,
        }}
      >
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Overview
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Permionics Intelligence Dashboard
          </p>
        </motion.div>
        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          {canManage && <ActionBtn href="~/generator" icon={Plus} label="New Case Study" accent="hsl(var(--primary))" />}
          <ActionBtn href="~/questionnaire" icon={FileText} label="Questionnaire" accent="hsl(var(--secondary))" />
        </motion.div>
      </div>

      {/* ── Page body ── */}
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* ── Stat cards ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Case Studies"
            value={stats.totalCaseStudies}
            icon={Briefcase}
            accent="hsl(var(--primary))"
            sublabel="In Case Library"
            delay={0.1}
          />
          <StatCard
            label="Questionnaires"
            value={stats.totalQuestionnaires}
            icon={ClipboardList}
            accent="hsl(var(--secondary))"
            sublabel="Generated"
            delay={0.2}
          />
          <StatCard
            label="Sectors Covered"
            value={stats.sectorsCount}
            icon={MapPin}
            accent="hsl(var(--warning))"
            sublabel="Industry verticals"
            delay={0.3}
          />
          <StatCard
            label="Last Updated"
            value={lastUpdatedStr}
            icon={Clock}
            accent="hsl(var(--success))"
            sublabel="Most recent entry"
            delay={0.4}
          />
        </div>

        {/* ── Main content grid ── */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 rounded-2xl overflow-hidden glass"
            style={{
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-7 py-5"
              style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}
                >
                  <Activity className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Recent Activity</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: "var(--muted-foreground)" }}>Latest library additions</p>
                </div>
              </div>
              <Link href="~/library">
                <button className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-70 border-0 bg-transparent cursor-pointer group" style={{ color: "hsl(var(--secondary))" }}>
                  View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Activity list */}
            <div className="divide-y font-normal" style={{ borderColor: "var(--glass-border)" }}>
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    key={index}
                    className="flex items-center gap-4 px-7 py-5 hover:bg-white/5 dark:hover:bg-white/5 transition-colors group cursor-default"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: activity.type === "case_study"
                          ? "hsl(var(--primary) / 0.15)"
                          : "hsl(var(--secondary) / 0.15)",
                      }}
                    >
                      {activity.type === "case_study" ? (
                        <Briefcase className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                      ) : (
                        <ClipboardList className="w-4 h-4" style={{ color: "hsl(var(--secondary))" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getSectorColor(activity.sector)}`}
                        >
                          {activity.sector}
                        </Badge>
                        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                          {activity.type === "case_study" ? "Case Study" : "Questionnaire"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                        {format(new Date(activity.createdAt), "MMM d")}
                      </span>
                      <ArrowUpRight className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-10 h-10 mb-4 opacity-20" style={{ color: "var(--foreground)" }} />
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No recent activity</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>Add case studies to see them here</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Sector Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 rounded-2xl overflow-hidden glass flex flex-col"
            style={{
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              className="flex items-center gap-3 px-7 py-5"
              style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: "hsl(var(--secondary) / 0.15)" }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: "hsl(var(--secondary))" }} />
              </div>
              <div>
                <p className="text-base font-bold" style={{ color: "var(--foreground)" }}>Sector Breakdown</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: "var(--muted-foreground)" }}>Industry distribution</p>
              </div>
            </div>

            <div className="px-6 pb-6 flex-1 flex flex-col justify-center mt-2">
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                       data={sectorData}
                       cx="50%"
                       cy="50%"
                       innerRadius={65}
                       outerRadius={95}
                       paddingAngle={4}
                       dataKey="value"
                       strokeWidth={0}
                       cornerRadius={4}
                    >
                      {sectorData.map((_, index) => (
                         <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} className="drop-shadow-sm hover:opacity-80 transition-opacity cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Share"]}
                      contentStyle={{
                        borderRadius: 12,
                        background: "var(--glass-bg)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid var(--glass-border)",
                        fontSize: 12,
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        boxShadow: "var(--shadow-lg)",
                        color: "var(--foreground)",
                      }}
                      itemStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
                {sectorData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-xs font-medium truncate" style={{ color: "var(--muted-foreground)" }}>
                      {item.name}
                    </span>
                    <span className="text-xs font-extrabold ml-auto" style={{ color: "var(--foreground)" }}>
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Quick links row ── */}
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              href: "~/library",
              icon: Briefcase,
              title: "Case Study Library",
              desc: "Browse all client case studies and outcomes",
              accent: "hsl(var(--primary))",
            },
            ...(canManage
              ? [
                  {
                    href: "~/generator",
                    icon: FileText,
                    title: "Case Study Generator",
                    desc: "Create structured case studies with AI assistance",
                    accent: "hsl(var(--secondary))",
                  },
                ]
              : []),
            {
              href: "~/assistant",
              icon: Activity,
              title: "Osmos AI",
              desc: "Ask OSMOS for project intelligence from documents",
              accent: "hsl(var(--success))",
            },
          ].map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + (0.1 * index) }}
              key={item.href}
            >
              <Link href={item.href}>
                <div
                  className="rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:scale-[1.02] glass hover:shadow-xl relative overflow-hidden h-full flex flex-col"
                  style={{
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowUpRight className="w-5 h-5" style={{ color: item.accent }} />
                  </div>
                  
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `color-mix(in srgb, ${item.accent} 15%, transparent)` }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: item.accent }} />
                  </div>
                  <p className="text-base font-bold mb-1.5 text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed font-medium text-muted-foreground flex-1">
                    {item.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
