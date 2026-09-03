import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, HeartPulse, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/AppShell";
import { ConfirmDelete, EmptyState, Field, LoadFailed, Panel } from "@/components/common";
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
import type { OkResponse, Patient, PatientPage, Pregnancy, PrenatalVisit } from "@/lib/types";

const RISK_LABELS: Record<string, string> = { Normal: "Normal", "High Risk": "High Risk" };

export default function Maternal() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Pregnancy | null>(null);

  const { data: list, isError } = useQuery<Pregnancy[]>({
    queryKey: ["pregnancies", search],
    queryFn: () => apiGet<Pregnancy[]>(`/pregnancies?search=${encodeURIComponent(search)}`),
  });

  const rows = list ?? [];
  const active = rows.find((p) => p.id === selected) ?? rows[0] ?? null;

  const { data: visits } = useQuery<PrenatalVisit[]>({
    queryKey: ["prenatal-visits", active?.id],
    queryFn: () => apiGet<PrenatalVisit[]>(`/pregnancies/${active?.id}/visits`),
    enabled: !!active,
  });

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/pregnancies/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pregnancies"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Pregnancy record deleted");
      setSelected(null);
      setToDelete(null);
    },
    onError: (e) => toast.error(errText(e, "Could not delete this record.")),
  });

  const highRisk = rows.filter((r) => r.risk_type === "High Risk").length;

  return (
    <>
      <PageHeading
        title="Pregnant Women"
        subtitle="Maternal care registry with prenatal visit tracking."
        action={
          <Button onClick={() => setAddOpen(true)} data-testid="add-pregnancy-button">
            <Plus className="size-4" /> Add Pregnancy Record
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel testid="maternal-stat-total">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pregnant</p>
          <p className="mt-1 font-heading text-3xl font-bold text-[#0B2B28]">{rows.length}</p>
        </Panel>
        <Panel testid="maternal-stat-highrisk">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">High-Risk Pregnancies</p>
          <p className="mt-1 font-heading text-3xl font-bold text-[#9D174D]">{highRisk}</p>
        </Panel>
        <Panel testid="maternal-stat-visits">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prenatal Visits Logged</p>
          <p className="mt-1 font-heading text-3xl font-bold text-[#0B2B28]">{visits?.length ?? 0}</p>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Maternal Registry" className="lg:col-span-1 [&>div]:p-0" testid="maternal-list">
          <div className="relative border-b border-brand-line p-4">
            <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search mother name or ID"
              data-testid="maternal-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isError ? (
            <LoadFailed what="the maternal registry" />
          ) : rows.length === 0 ? (
            <EmptyState message="No pregnancy records" hint="Add a pregnancy record for a registered patient." />
          ) : (
            <ul className="max-h-[520px] divide-y divide-brand-line overflow-y-auto">
              {rows.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    data-testid={`maternal-item-${p.patient_code}`}
                    onClick={() => setSelected(p.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#F4F7F6] ${
                      active?.id === p.id ? "bg-[#EEF7F5]" : ""
                    }`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FCE7F3] font-bold text-[#9D174D]">
                      {p.patient_name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#0B2B28]">{p.patient_name}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">{p.patient_code}</span>
                    </span>
                    {p.risk_type === "High Risk" && (
                      <span className="rounded-full bg-[#FFE4E6] px-2 py-0.5 text-[10px] font-bold text-[#BE123C]">HIGH RISK</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5 lg:col-span-2">
          {!active ? (
            <Panel testid="maternal-detail-empty">
              <EmptyState message="Select a pregnant woman" hint="Choose a record from the registry to view pregnancy details." />
            </Panel>
          ) : (
            <>
              <Panel
                title="Pregnancy Information"
                testid="pregnancy-information"
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} data-testid="edit-pregnancy-button">
                      <Pencil className="size-3.5" /> Edit Information
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setToDelete(active)} data-testid="delete-pregnancy-button">
                      Delete
                    </Button>
                  </div>
                }
              >
                <div className="mb-5 flex items-center gap-4 rounded-xl bg-[#FDF2F8] p-4">
                  <span className="grid size-14 place-items-center rounded-full bg-[#FCE7F3] font-heading text-xl font-bold text-[#9D174D]">
                    {active.patient_name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-heading text-lg font-bold text-[#0B2B28]" data-testid="pregnancy-patient-name">
                      {active.patient_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {active.patient_age} years old &middot; <span className="font-mono">{active.patient_code}</span>
                    </p>
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#9D174D]">
                    <HeartPulse className="size-3.5" /> {active.risk_type}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Gravida" value={String(active.gravida)} />
                  <Field label="Para" value={String(active.para)} />
                  <Field label="Blood Type" value={active.blood_type} />
                  <Field label="Expected Due Date" value={active.expected_due_date} />
                  <Field label="Last Menstrual Period" value={active.last_menstrual_period} />
                  <Field label="Risk Type" value={active.risk_type} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Notes" value={active.notes} />
                  </div>
                </div>
              </Panel>

              <Panel
                title="Prenatal Visits"
                className="[&>div]:p-0"
                testid="prenatal-visits-panel"
                action={
                  <Button size="sm" onClick={() => setVisitOpen(true)} data-testid="add-prenatal-visit-button">
                    <CalendarPlus className="size-3.5" /> Add Prenatal Visit
                  </Button>
                }
              >
                {(visits ?? []).length === 0 ? (
                  <EmptyState message="No prenatal visits logged" hint="Record the first prenatal check-up for this mother." />
                ) : (
                  <Table data-testid="prenatal-visits-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Week</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Health Worker</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(visits ?? []).map((v) => (
                        <TableRow key={v.id} data-testid={`prenatal-visit-row-${v.id}`}>
                          <TableCell className="whitespace-nowrap font-medium">{v.visit_date}</TableCell>
                          <TableCell>Week {v.pregnancy_week}</TableCell>
                          <TableCell className="text-muted-foreground">{v.notes || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{v.health_worker}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Panel>
            </>
          )}
        </div>
      </div>

      <PregnancyDialog open={addOpen} onOpenChange={setAddOpen} />
      {active && <PregnancyDialog open={editOpen} onOpenChange={setEditOpen} pregnancy={active} />}
      {active && <VisitDialog open={visitOpen} onOpenChange={setVisitOpen} pregnancyId={active.id} />}
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete pregnancy record?"
        description={`This removes the pregnancy record for ${toDelete?.patient_name ?? ""} and all its prenatal visits.`}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        pending={del.isPending}
      />
    </>
  );
}

function PregnancyDialog({
  open, onOpenChange, pregnancy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pregnancy?: Pregnancy;
}) {
  const qc = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [gravida, setGravida] = useState(String(pregnancy?.gravida ?? 1));
  const [para, setPara] = useState(String(pregnancy?.para ?? 0));
  const [edd, setEdd] = useState(pregnancy?.expected_due_date ?? "");
  const [lmp, setLmp] = useState(pregnancy?.last_menstrual_period ?? "");
  const [risk, setRisk] = useState(pregnancy?.risk_type ?? "Normal");
  const [notes, setNotes] = useState(pregnancy?.notes ?? "");
  const [error, setError] = useState("");

  const { data: patients } = useQuery<PatientPage>({
    queryKey: ["patients", "maternal-options"],
    queryFn: () => apiGet<PatientPage>("/patients?sex=Female&page_size=100"),
    enabled: open && !pregnancy,
  });
  const options: Patient[] = patients?.items ?? [];

  const save = useMutation({
    mutationFn: () => {
      const body = {
        gravida: Number(gravida) || 1, para: Number(para) || 0,
        expected_due_date: edd, last_menstrual_period: lmp, risk_type: risk, notes,
      };
      return pregnancy
        ? apiPut<Pregnancy>(`/pregnancies/${pregnancy.id}`, body)
        : apiPost<Pregnancy>("/pregnancies", { ...body, patient_id: patientId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["pregnancies"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(pregnancy ? "Pregnancy information updated" : "Pregnancy record added");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save the pregnancy record.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="pregnancy-dialog">
        <DialogHeader>
          <DialogTitle>{pregnancy ? "Edit Pregnancy Information" : "Add Pregnancy Record"}</DialogTitle>
          <DialogDescription>Maternal health details used for prenatal monitoring.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          data-testid="pregnancy-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!pregnancy && !patientId) return setError("Please select a patient.");
            save.mutate();
          }}
        >
          {!pregnancy && (
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={patientId} onValueChange={(v: string) => setPatientId(v)}>
                <SelectTrigger data-testid="pregnancy-patient-select">
                  <SelectValue placeholder="Select a female patient">
                    {(v) => options.find((o) => o.id === v)?.full_name ?? "Select a female patient"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.full_name} ({o.patient_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gravida">Gravida</Label>
              <Input id="gravida" type="number" min={0} data-testid="pregnancy-gravida-input" value={gravida} onChange={(e) => setGravida(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="para">Para</Label>
              <Input id="para" type="number" min={0} data-testid="pregnancy-para-input" value={para} onChange={(e) => setPara(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lmp">Last Menstrual Period</Label>
              <Input id="lmp" type="date" data-testid="pregnancy-lmp-input" value={lmp} onChange={(e) => setLmp(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edd">Expected Due Date</Label>
              <Input id="edd" type="date" data-testid="pregnancy-edd-input" value={edd} onChange={(e) => setEdd(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Risk Type</Label>
              <Select value={risk} onValueChange={(v: string) => setRisk(v)}>
                <SelectTrigger data-testid="pregnancy-risk-select">
                  <SelectValue>{(v) => RISK_LABELS[v as string] ?? "Normal"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High Risk">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pnotes">Notes</Label>
              <Textarea id="pnotes" rows={3} data-testid="pregnancy-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          {error && <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="pregnancy-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} data-testid="pregnancy-form-submit">
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VisitDialog({
  open, onOpenChange, pregnancyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pregnancyId: string;
}) {
  const qc = useQueryClient();
  const [visitDate, setVisitDate] = useState("");
  const [week, setWeek] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: () =>
      apiPost<PrenatalVisit>("/prenatal-visits", {
        pregnancy_id: pregnancyId, visit_date: visitDate,
        pregnancy_week: Number(week) || 0, notes,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["prenatal-visits"] });
      toast.success("Prenatal visit recorded");
      setVisitDate(""); setWeek(""); setNotes("");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save the prenatal visit.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="prenatal-visit-dialog">
        <DialogHeader>
          <DialogTitle>Add Prenatal Visit</DialogTitle>
          <DialogDescription>Log a prenatal check-up for this pregnancy.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          data-testid="prenatal-visit-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!visitDate) return setError("Visit date is required.");
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="vd">Visit Date *</Label>
            <Input id="vd" type="date" data-testid="visit-date-input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vw">Pregnancy Week</Label>
            <Input id="vw" type="number" min={0} max={45} data-testid="visit-week-input" value={week} onChange={(e) => setWeek(e.target.value)} placeholder="e.g. 24" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vn">Notes</Label>
            <Textarea id="vn" rows={3} data-testid="visit-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Fetal heart tones strong, BP normal." />
          </div>
          {error && <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="visit-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} data-testid="visit-form-submit">
              {save.isPending ? "Saving..." : "Add Visit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
