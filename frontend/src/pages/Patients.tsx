import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/AppShell";
import { ConfirmDelete, EmptyState, LoadFailed, Pager, Panel, TypeBadge } from "@/components/common";
import PatientFormDialog, { errText } from "@/components/PatientFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiDelete, apiGet } from "@/lib/api";
import type { OkResponse, Patient, PatientPage } from "@/lib/types";
import { PATIENT_TYPE_LABELS } from "@/lib/types";

const AGE_LABELS: Record<string, string> = {
  all: "All Ages", "0-5": "0–5 years", "6-18": "6–18 years", "19-59": "19–59 years", "60+": "60+ years",
};
const SEX_LABELS: Record<string, string> = { all: "All Sexes", Female: "Female", Male: "Male" };
const TYPE_LABELS: Record<string, string> = { all: "All Types", ...PATIENT_TYPE_LABELS };

export default function Patients() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState("all");
  const [sex, setSex] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const { data, isError, isLoading } = useQuery<PatientPage>({
    queryKey: ["patients", { search, ageGroup, sex, type, page }],
    queryFn: () =>
      apiGet<PatientPage>(
        `/patients?search=${encodeURIComponent(search)}&age_group=${ageGroup}&sex=${sex}&patient_type=${type}&page=${page}&page_size=8`,
      ),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/patients/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["patients"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Patient record deleted");
      setToDelete(null);
    },
    onError: (e) => toast.error(errText(e, "Could not delete this patient.")),
  });

  function reset<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  return (
    <>
      <PageHeading
        title="Patients"
        subtitle="Registry of all residents profiled at the barangay health center."
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-testid="register-patient-button">
            <UserPlus className="size-4" /> Register Patient
          </Button>
        }
      />

      <Panel className="[&>div]:p-0" testid="patients-panel">
        <div className="grid gap-3 border-b border-brand-line p-5 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by patient ID, name or PhilHealth no."
              data-testid="patient-search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={ageGroup} onValueChange={reset(setAgeGroup)}>
            <SelectTrigger data-testid="filter-age-group">
              <SelectValue>{(v) => AGE_LABELS[v as string]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AGE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select value={sex} onValueChange={reset(setSex)}>
              <SelectTrigger data-testid="filter-sex">
                <SelectValue>{(v) => SEX_LABELS[v as string]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEX_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={reset(setType)}>
              <SelectTrigger data-testid="filter-patient-type">
                <SelectValue>{(v) => TYPE_LABELS[v as string]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isError ? (
          <LoadFailed what="the patient registry" />
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading patients...</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState message="No patients found" hint="Adjust your search or filters, or register a new resident." />
        ) : (
          <>
            <Table data-testid="patients-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((p) => (
                  <TableRow key={p.id} data-testid={`patient-row-${p.patient_id}`}>
                    <TableCell className="font-mono text-xs">{p.patient_id}</TableCell>
                    <TableCell className="font-medium">
                      <Link to={`/patients/${p.id}`} className="hover:text-brand-teal-dark hover:underline">
                        {p.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>{p.sex}</TableCell>
                    <TableCell><TypeBadge type={p.patient_type} label={PATIENT_TYPE_LABELS[p.patient_type] ?? "General"} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/patients/${p.id}`}
                          data-testid={`view-patient-${p.patient_id}`}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#CCFBF1] hover:text-[#115E59]"
                          aria-label={`View ${p.full_name}`}
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          type="button"
                          data-testid={`edit-patient-${p.patient_id}`}
                          onClick={() => { setEditing(p); setFormOpen(true); }}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FEF3C7] hover:text-[#92400E]"
                          aria-label={`Edit ${p.full_name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          data-testid={`delete-patient-${p.patient_id}`}
                          onClick={() => setToDelete(p)}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FFE4E6] hover:text-[#BE123C]"
                          aria-label={`Delete ${p.full_name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onChange={setPage} testid="patients-pager" />
          </>
        )}
      </Panel>

      <PatientFormDialog open={formOpen} onOpenChange={setFormOpen} patient={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete patient record?"
        description={`This permanently removes ${toDelete?.full_name ?? "this patient"} and all linked health records, pregnancies and child records. This cannot be undone.`}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        pending={del.isPending}
      />
    </>
  );
}
