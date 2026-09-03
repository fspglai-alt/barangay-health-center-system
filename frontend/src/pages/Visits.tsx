import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { PageHeading } from "@/components/AppShell";
import { EmptyState, LoadFailed, Pager, Panel } from "@/components/common";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import type { HealthRecordPage } from "@/lib/types";
import { CONSULTATION_TYPES } from "@/lib/types";

const TYPE_FILTER: Record<string, string> = {
  all: "All Types",
  ...Object.fromEntries(CONSULTATION_TYPES.map((t) => [t, t])),
};

export default function Visits() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isError, isLoading } = useQuery<HealthRecordPage>({
    queryKey: ["records", "visits", { search, type, page }],
    queryFn: () =>
      apiGet<HealthRecordPage>(
        `/records?search=${encodeURIComponent(search)}&consultation_type=${encodeURIComponent(type)}&page=${page}&page_size=10`,
      ),
  });

  return (
    <>
      <PageHeading
        title="Visit History"
        subtitle="Chronological consultation log across all barangay residents."
        action={
          <Link to="/records?new=1" className={buttonVariants()} data-testid="add-consultation-button">
            <Plus className="size-4" /> Add Consultation
          </Link>
        }
      />

      <Panel className="[&>div]:p-0" testid="visits-panel">
        <div className="grid gap-3 border-b border-brand-line p-5 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by patient name or record ID"
              data-testid="visit-search-input" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={type} onValueChange={(v: string) => { setType(v); setPage(1); }}>
            <SelectTrigger data-testid="visit-filter-type">
              <SelectValue>{(v) => TYPE_FILTER[v as string]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_FILTER).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <LoadFailed what="visit history" />
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading visit history...</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState message="No visits found" hint="Consultations logged at the health center will appear here." />
        ) : (
          <>
            <Table data-testid="visits-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Consultation Type</TableHead>
                  <TableHead>Chief Complaint / Notes</TableHead>
                  <TableHead>Health Worker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((r) => (
                  <TableRow key={r.id} data-testid={`visit-row-${r.record_id}`}>
                    <TableCell className="whitespace-nowrap font-medium">{r.consultation_date}</TableCell>
                    <TableCell>
                      <Link to={`/patients/${r.patient_id}`} className="font-medium hover:text-brand-teal-dark hover:underline">
                        {r.patient_name}
                      </Link>
                      <span className="block font-mono text-[11px] text-muted-foreground">{r.patient_code}</span>
                    </TableCell>
                    <TableCell>{r.consultation_type}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {r.chief_complaint || r.notes || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.health_worker}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onChange={setPage} testid="visits-pager" />
          </>
        )}
      </Panel>
    </>
  );
}
