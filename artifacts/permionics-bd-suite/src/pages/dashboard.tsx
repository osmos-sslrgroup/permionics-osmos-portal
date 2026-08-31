import { useGetDashboardStats, useListCaseStudies } from "@workspace/api-client-react";
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

const CHART_COLORS = ["#1e40af", "#3b82f6", "#0ea5e9", "#06b6d4", "#6366f1", "#8b5cf6"];

function getSectorColor(sector: string) {
  const s = sector.toLowerCase();
  if (s.includes("pharma") || s.includes("herbal"))
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (s.includes("textile"))
    return "bg-teal-100 text-teal-700 border-teal-200";
  if (s.includes("cetp") || s.includes("municipal"))
    return "bg-amber-100 text-amber-700 border-amber-200";
  if (s.includes("food") || s.includes("beverage"))
    return "bg-green-100 text-green-700 border-green-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
}: {
  label: string;
  value: string | number;
  icon: any;
  accent: string;
  sublabel?: string;
}) {
  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-muted-foreground">
            {label}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
          {sublabel && (
            <p className="text-xs mt-1.5 text-muted-foreground">
              {sublabel}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
      </div>
    </div>
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
          boxShadow: `0 4px 14px ${accent}55`,
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

  const isLoading = statsLoading || csLoading;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-40 rounded-xl animate-pulse" style={{ background: "hsl(220 15% 90%)" }} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "hsl(220 15% 92%)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-8">
        <div
          className="rounded-2xl p-6 border"
          style={{ background: "hsl(38 92% 97%)", borderColor: "hsl(38 92% 85%)" }}
        >
          <p className="font-bold text-amber-800 mb-1">Database setup required</p>
          <p className="text-sm text-amber-700">
            Run the <code className="bg-amber-100 px-1 rounded">supabase-migration.sql</code> in your Supabase SQL editor to create the required tables.
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
    <div className="min-h-full text-foreground" style={{ background: "hsl(var(--background))" }}>
      {/* ── Top header bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-8 h-16 print-hide"
        style={{
          background: "hsl(var(--card))",
          borderBottom: "1px solid hsl(var(--border))",
          boxShadow: "0 1px 0 hsl(var(--border))",
        }}
      >
        <div>
          <h1 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
            Overview
          </h1>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Permionics Intelligence Dashboard
          </p>
        </div>
        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <ActionBtn href="~/generator" icon={Plus} label="New Case Study" accent="hsl(var(--primary))" />
          <ActionBtn href="~/questionnaire" icon={FileText} label="Questionnaire" accent="hsl(var(--secondary))" />
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="p-8 space-y-8">
        {/* ── Stat cards ── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Case Studies"
            value={stats.totalCaseStudies}
            icon={Briefcase}
            accent="hsl(var(--primary))"
            sublabel="In Case Library"
          />
          <StatCard
            label="Questionnaires"
            value={stats.totalQuestionnaires}
            icon={ClipboardList}
            accent="hsl(var(--secondary))"
            sublabel="Generated"
          />
          <StatCard
            label="Sectors Covered"
            value={stats.sectorsCount}
            icon={MapPin}
            accent="hsl(175 70% 38%)"
            sublabel="Industry verticals"
          />
          <StatCard
            label="Last Updated"
            value={lastUpdatedStr}
            icon={Clock}
            accent="hsl(280 65% 55%)"
            sublabel="Most recent entry"
          />
        </div>

        {/* ── Main content grid ── */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Recent Activity */}
          <div
            className="lg:col-span-4 rounded-2xl overflow-hidden"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}
                >
                  <Activity className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Recent Activity</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Latest library additions</p>
                </div>
              </div>
              <Link href="~/library">
                <button className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70 border-0 bg-transparent cursor-pointer" style={{ color: "hsl(var(--secondary))" }}>
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>

            {/* Activity list */}
            <div className="divide-y font-normal" style={{ borderColor: "hsl(var(--border))" }}>
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: activity.type === "case_study"
                          ? "hsl(var(--primary) / 0.1)"
                          : "hsl(var(--secondary) / 0.1)",
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 h-4 rounded-full font-medium border ${getSectorColor(activity.sector)}`}
                        >
                          {activity.sector}
                        </Badge>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {activity.type === "case_study" ? "Case Study" : "Questionnaire"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {format(new Date(activity.createdAt), "MMM d")}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="w-8 h-8 mb-3" style={{ color: "var(--muted-foreground)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>No recent activity</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Add case studies to see them here</p>
                </div>
              )}
            </div>
          </div>

          {/* Sector Distribution */}
          <div
            className="lg:col-span-3 rounded-2xl overflow-hidden"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <div
              className="flex items-center gap-2.5 px-6 py-4"
              style={{ borderBottom: "1px solid hsl(var(--border))" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "hsl(var(--secondary) / 0.1)" }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--secondary))" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Sector Breakdown</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Industry distribution</p>
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                       data={sectorData}
                       cx="50%"
                       cy="50%"
                       innerRadius={55}
                       outerRadius={80}
                       paddingAngle={3}
                       dataKey="value"
                       strokeWidth={0}
                    >
                      {sectorData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Share"]}
                      contentStyle={{
                        borderRadius: 12,
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        color: "var(--foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-2">
                {sectorData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                      {item.name}
                    </span>
                    <span className="text-xs font-bold ml-auto" style={{ color: "var(--foreground)" }}>
                      {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick links row ── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              href: "~/library",
              icon: Briefcase,
              title: "Case Study Library",
              desc: "Browse all client case studies and outcomes",
              accent: "#3b82f6",
              accentBg: "rgba(59,130,246,0.08)",
            },
            {
              href: "~/generator",
              icon: FileText,
              title: "Case Study Generator",
              desc: "Create structured case studies with AI assistance",
              accent: "#6366f1",
              accentBg: "rgba(99,102,241,0.08)",
            },
            {
              href: "~/assistant",
              icon: Activity,
              title: "Osmos AI",
              desc: "Ask OSMOS for project intelligence from all your documents",
              accent: "#10b981",
              accentBg: "rgba(16,185,129,0.08)",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className="rounded-2xl p-5 cursor-pointer group transition-all hover:scale-[1.01] hover:shadow-lg dark:hover:shadow-xl"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: item.accentBg }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.accent }} />
                </div>
                <p className="text-sm font-bold mb-1 text-foreground">
                  {item.title}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: item.accent }}>
                  Open <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
