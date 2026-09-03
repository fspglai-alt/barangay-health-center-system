import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Baby, BarChart3, HeartPulse, Stethoscope, Users } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { PageHeading } from "@/components/AppShell";
import { EmptyState, LoadFailed, Panel, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet } from "@/lib/api";
import type { ReportSummary } from "@/lib/types";

const PIE_COLORS = ["#0D9488", "#EC4899", "#F59E0B", "#6366F1"];

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function monthEnd() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function Reports() {
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(monthEnd());
  const [range, setRange] = useState({ start: monthStart(), end: monthEnd() });

  const { data, isError } = useQuery<ReportSummary>({
    queryKey: ["reports", range],
    queryFn: () => apiGet<ReportSummary>(`/reports?start=${range.start}&end=${range.end}`),
  });

  const consultTotal = (data?.by_consultation_type ?? []).reduce((s, d) => s + d.value, 0);

  return (
    <>
      <PageHeading
        title="Reports"
        subtitle="Health center statistics and analytics for a selected reporting period."
      />

      <Panel testid="report-range-panel">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="rs">From</Label>
            <Input id="rs" type="date" data-testid="report-start-input" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="re">To</Label>
            <Input id="re" type="date" data-testid="report-end-input" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <Button onClick={() => setRange({ start, end })} data-testid="generate-report-button">
            <BarChart3 className="size-4" /> Generate Report
          </Button>
          <p className="ml-auto text-xs text-muted-foreground" data-testid="report-range-label">
            Reporting period: {data?.range_start ?? range.start} to {data?.range_end ?? range.end}
          </p>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard testid="report-stat-patients" title="Total Patients" value={data?.total_patients ?? "—"} icon={Users} tone="teal" />
        <StatCard testid="report-stat-pregnant" title="Pregnant Women" value={data?.total_pregnant ?? "—"} icon={HeartPulse} tone="rose" />
        <StatCard testid="report-stat-children" title="Babies / Children" value={data?.total_children ?? "—"} icon={Baby} tone="amber" />
        <StatCard testid="report-stat-consultations" title="Total Consultations" value={data?.total_consultations ?? "—"} icon={Stethoscope} tone="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Patients by Type" description="Registry composition" testid="chart-patients-by-type">
          {isError ? (
            <LoadFailed what="patient type breakdown" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.by_type ?? []} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2ECE9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="#8FA9A5" interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#8FA9A5" />
                <Tooltip cursor={{ fill: "#F4F7F6" }} contentStyle={{ borderRadius: 12, border: "1px solid #E2ECE9", fontSize: 13 }} />
                <Bar dataKey="value" name="Count" fill="#0D9488" radius={[8, 8, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Consultations by Type" description="Within the selected period" testid="chart-consultations-by-type">
          {isError ? (
            <LoadFailed what="consultation breakdown" />
          ) : consultTotal === 0 ? (
            <EmptyState message="No consultations in this period" hint="Try widening the date range and generating again." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data?.by_consultation_type ?? []} dataKey="value" nameKey="name" outerRadius={100} stroke="none">
                  {(data?.by_consultation_type ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2ECE9", fontSize: 13 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </>
  );
}
