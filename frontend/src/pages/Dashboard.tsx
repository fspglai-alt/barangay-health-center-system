import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Baby, BarChart3, FileText, HeartPulse, Search, Stethoscope, UserPlus, Users,
} from "lucide-react";
import {
  Area, AreaChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeading } from "@/components/AppShell";
import { EmptyState, LoadFailed, Panel, StatCard } from "@/components/common";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

const DONUT_COLORS = ["#0D9488", "#F59E0B", "#6366F1", "#EC4899"];

const QUICK_LINKS = [
  { label: "Register Patient", to: "/patients?new=1", icon: UserPlus, testid: "quick-register-patient" },
  { label: "Add Health Record", to: "/records?new=1", icon: FileText, testid: "quick-add-record" },
  { label: "Search Patient", to: "/patients", icon: Search, testid: "quick-search-patient" },
  { label: "Generate Report", to: "/reports", icon: BarChart3, testid: "quick-generate-report" },
];

export default function Dashboard() {
  const { data, isError } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardStats>("/dashboard"),
  });

  const stats = isError ? null : data;
  const monthSeries = (stats?.consultations_this_month ?? []).map((d) => ({
    day: d.name,
    consultations: d.value,
  }));

  return (
    <>
      <PageHeading
        title="Dashboard"
        subtitle="Overview of barangay health center activity and resident health records."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard testid="stat-total-patients" title="Total Patients" value={stats?.total_patients ?? "—"} icon={Users} tone="teal" viewAll="/patients" />
        <StatCard testid="stat-total-pregnant" title="Total Pregnant Women" value={stats?.total_pregnant ?? "—"} icon={HeartPulse} tone="rose" viewAll="/maternal" />
        <StatCard testid="stat-total-children" title="Total Babies / Children" value={stats?.total_children ?? "—"} icon={Baby} tone="amber" viewAll="/pediatric" />
        <StatCard testid="stat-today-consultations" title="Today's Consultations" value={stats?.todays_consultations ?? "—"} icon={Stethoscope} tone="emerald" viewAll="/visits" />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Panel title="Patients by Age Group" description="Distribution of registered residents" className="lg:col-span-2" testid="chart-age-group">
          {isError ? (
            <LoadFailed what="age distribution" />
          ) : (stats?.by_age_group ?? []).every((d) => d.value === 0) ? (
            <EmptyState message="No patients registered yet" hint="Register a resident to see the age breakdown." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats?.by_age_group ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="none"
                >
                  {(stats?.by_age_group ?? []).map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2ECE9", fontSize: 13 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Consultations This Month" description="Daily consultation volume" className="lg:col-span-3" testid="chart-consultations-month">
          {isError ? (
            <LoadFailed what="consultation trend" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthSeries} margin={{ left: -22, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="tealFade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke="#8FA9A5" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#8FA9A5" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #E2ECE9", fontSize: 13 }}
                  labelFormatter={(l) => `Day ${l}`}
                />
                <Area type="monotone" dataKey="consultations" stroke="#0D9488" strokeWidth={2.5} fill="url(#tealFade)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel
          title="Recent Consultations"
          className="lg:col-span-2 [&>div]:p-0"
          testid="recent-consultations"
          action={
            <Link to="/visits" className="text-xs font-semibold text-brand-teal-dark hover:underline" data-testid="recent-view-all">
              View All &rarr;
            </Link>
          }
        >
          {isError ? (
            <LoadFailed what="recent consultations" />
          ) : (stats?.recent_consultations ?? []).length === 0 ? (
            <EmptyState message="No consultations recorded" hint="Add a health record to populate this log." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Health Worker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.recent_consultations ?? []).map((r) => (
                  <TableRow key={r.id} data-testid={`recent-row-${r.record_id}`}>
                    <TableCell className="font-mono text-xs">{r.patient_code}</TableCell>
                    <TableCell className="font-medium">{r.patient_name}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{r.consultation_date}</TableCell>
                    <TableCell>{r.consultation_type}</TableCell>
                    <TableCell className="text-muted-foreground">{r.health_worker}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel title="Quick Links" description="Common health center actions" testid="quick-links">
          <div className="space-y-2.5">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.label}
                to={q.to}
                data-testid={q.testid}
                className="flex items-center gap-3 rounded-xl border border-brand-line bg-[#F8FBFA] px-4 py-3 text-sm font-semibold text-[#0B2B28] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#CCFBF1]"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-brand-teal text-white">
                  <q.icon className="size-[18px]" />
                </span>
                {q.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
