import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/AppShell";
import { ConfirmDelete, EmptyState, Field, LoadFailed, Pager, Panel } from "@/components/common";
import { errText } from "@/components/PatientFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { HealthRecord, HealthRecordPage, OkResponse, Patient, PatientPage } from "@/lib/types";
import { CONSULTATION_TYPES } from "@/lib/types";

const TYPE_FILTER: Record<string, string> = {
  all: "All Types",
  ...Object.fromEntries(CONSULTATION_TYPES.map((t) => [t, t])),
};

export default function Records() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [viewing, setViewing] = useState<HealthRecord | null>(null);
  const [toDelete, setToDelete] = useState<HealthRecord | null>(null);

  useEffect(() => {
    if (params.get("new") === "1") {
      setEditing(null);
      setFormOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const { data, isError, isLoading } = useQuery<HealthRecordPage>({
    queryKey: ["records", { search, type, page }],
    queryFn: () =>
      apiGet<HealthRecordPage>(
        `/records?search=${encodeURIComponent(search)}&consultation_type=${encodeURIComponent(type)}&page=${page}&page_size=8`,
      ),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/records/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["records"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Health record deleted");
      setToDelete(null);
    },
    onError: (e) => toast.error(errText(e, "Could not delete this record.")),
  });

  return (
    <>
      <PageHeading
        title="Health Records"
        subtitle="All clinical consultations logged at the health center."
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-testid="add-health-record-button">
            <Plus className="size-4" /> Add Health Record
          </Button>
        }
      />

      <Panel className="[&>div]:p-0" testid="records-panel">
        <div className="grid gap-3 border-b border-brand-line p-5 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by record ID, patient name or complaint"
              data-testid="record-search-input" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={type} onValueChange={(v: string) => { setType(v); setPage(1); }}>
            <SelectTrigger data-testid="filter-consultation-type">
              <SelectValue>{(v) => TYPE_FILTER[v as string]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_FILTER).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isError ? (
          <LoadFailed what="health records" />
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading health records...</p>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState message="No health records found" hint="Adjust your search or add a new consultation record." />
        ) : (
          <>
            <Table data-testid="records-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Health Worker</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((r) => (
                  <TableRow key={r.id} data-testid={`record-row-${r.record_id}`}>
                    <TableCell className="font-mono text-xs">{r.record_id}</TableCell>
                    <TableCell className="font-medium">{r.patient_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.consultation_date}</TableCell>
                    <TableCell>{r.consultation_type}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">{r.chief_complaint || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.health_worker}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <button type="button" data-testid={`view-record-${r.record_id}`} onClick={() => setViewing(r)}
                          aria-label={`View ${r.record_id}`}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#CCFBF1] hover:text-[#115E59]">
                          <Eye className="size-4" />
                        </button>
                        <button type="button" data-testid={`edit-record-${r.record_id}`} onClick={() => { setEditing(r); setFormOpen(true); }}
                          aria-label={`Edit ${r.record_id}`}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FEF3C7] hover:text-[#92400E]">
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" data-testid={`delete-record-${r.record_id}`} onClick={() => setToDelete(r)}
                          aria-label={`Delete ${r.record_id}`}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FFE4E6] hover:text-[#BE123C]">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onChange={setPage} testid="records-pager" />
          </>
        )}
      </Panel>

      <RecordDialog open={formOpen} onOpenChange={setFormOpen} record={editing} />

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="record-view-dialog">
          <DialogHeader>
            <DialogTitle>Consultation {viewing?.record_id}</DialogTitle>
            <DialogDescription>{viewing?.patient_name} &middot; {viewing?.consultation_date}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Consultation Type" value={viewing?.consultation_type ?? ""} />
            <Field label="Health Worker" value={viewing?.health_worker ?? ""} />
            <div className="sm:col-span-2"><Field label="Chief Complaint" value={viewing?.chief_complaint ?? ""} /></div>
            <div className="sm:col-span-2"><Field label="Diagnosis" value={viewing?.diagnosis ?? ""} /></div>
            <div className="sm:col-span-2"><Field label="Treatment" value={viewing?.treatment ?? ""} /></div>
            <div className="sm:col-span-2"><Field label="Notes" value={viewing?.notes ?? ""} /></div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete health record?"
        description={`Record ${toDelete?.record_id ?? ""} for ${toDelete?.patient_name ?? ""} will be permanently removed.`}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        pending={del.isPending}
      />
    </>
  );
}

function RecordDialog({
  open, onOpenChange, record,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  record?: HealthRecord | null;
}) {
  const qc = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState(CONSULTATION_TYPES[0]);
  const [complaint, setComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setPatientId(record?.patient_id ?? "");
    setDate(record?.consultation_date ?? new Date().toISOString().slice(0, 10));
    setType(record?.consultation_type ?? CONSULTATION_TYPES[0]);
    setComplaint(record?.chief_complaint ?? "");
    setDiagnosis(record?.diagnosis ?? "");
    setTreatment(record?.treatment ?? "");
    setNotes(record?.notes ?? "");
  }, [open, record]);

  const { data: patients } = useQuery<PatientPage>({
    queryKey: ["patients", "record-options"],
    queryFn: () => apiGet<PatientPage>("/patients?page_size=100"),
    enabled: open,
  });
  const options: Patient[] = patients?.items ?? [];

  const save = useMutation({
    mutationFn: () => {
      const body = {
        consultation_date: date, consultation_type: type, chief_complaint: complaint,
        diagnosis, treatment, notes,
      };
      return record
        ? apiPut<HealthRecord>(`/records/${record.id}`, body)
        : apiPost<HealthRecord>("/records", { ...body, patient_id: patientId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["records"] });
      void qc.invalidateQueries({ queryKey: ["patient"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(record ? "Health record updated" : "Health record added");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save the health record.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="record-form-dialog">
        <DialogHeader>
          <DialogTitle>{record ? "Edit Health Record" : "Add Health Record"}</DialogTitle>
          <DialogDescription>Consultation details logged against a registered patient.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          data-testid="record-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!record && !patientId) return setError("Please select a patient.");
            if (!date) return setError("Consultation date is required.");
            save.mutate();
          }}
        >
          {!record && (
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={patientId} onValueChange={(v: string) => setPatientId(v)}>
                <SelectTrigger data-testid="record-patient-select">
                  <SelectValue placeholder="Select a patient">
                    {(v) => options.find((o) => o.id === v)?.full_name ?? "Select a patient"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.full_name} ({o.patient_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cdate">Consultation Date *</Label>
              <Input id="cdate" type="date" data-testid="record-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Consultation Type</Label>
              <Select value={type} onValueChange={(v: string) => setType(v)}>
                <SelectTrigger data-testid="record-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONSULTATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc">Chief Complaint</Label>
            <Input id="cc" data-testid="record-complaint-input" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Fever and body aches for 2 days" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dx">Diagnosis</Label>
            <Input id="dx" data-testid="record-diagnosis-input" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Acute viral infection" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tx">Treatment</Label>
            <Input id="tx" data-testid="record-treatment-input" value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Paracetamol 500mg q6h" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rn">Notes</Label>
            <Textarea id="rn" rows={2} data-testid="record-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="record-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} data-testid="record-form-submit">
              {save.isPending ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
