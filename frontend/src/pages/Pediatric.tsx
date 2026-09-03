import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Baby, Plus, Search, Syringe, Trash2 } from "lucide-react";
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
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Child, Immunization, OkResponse, Patient, PatientPage } from "@/lib/types";
import { VACCINE_OPTIONS } from "@/lib/types";

export default function Pediatric() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [immOpen, setImmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Child | null>(null);

  const { data: list, isError } = useQuery<Child[]>({
    queryKey: ["children", search],
    queryFn: () => apiGet<Child[]>(`/children?search=${encodeURIComponent(search)}`),
  });

  const rows = list ?? [];
  const active = rows.find((c) => c.id === selected) ?? rows[0] ?? null;

  const { data: shots } = useQuery<Immunization[]>({
    queryKey: ["immunizations", active?.id],
    queryFn: () => apiGet<Immunization[]>(`/children/${active?.id}/immunizations`),
    enabled: !!active,
  });

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/children/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["children"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Child record deleted");
      setSelected(null);
      setToDelete(null);
    },
    onError: (e) => toast.error(errText(e, "Could not delete this child record.")),
  });

  const delShot = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/immunizations/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["immunizations"] });
      toast.success("Immunization record removed");
    },
    onError: (e) => toast.error(errText(e, "Could not remove this immunization.")),
  });

  return (
    <>
      <PageHeading
        title="Babies / Children"
        subtitle="Pediatric profiles, growth monitoring and EPI immunization records."
        action={
          <Button onClick={() => setAddOpen(true)} data-testid="add-child-button">
            <Plus className="size-4" /> Add Child Record
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Child Registry" className="lg:col-span-1 [&>div]:p-0" testid="children-list">
          <div className="relative border-b border-brand-line p-4">
            <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search child name or ID" data-testid="child-search-input"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {isError ? (
            <LoadFailed what="the child registry" />
          ) : rows.length === 0 ? (
            <EmptyState message="No child records" hint="Add a child record for a registered patient." />
          ) : (
            <ul className="max-h-[520px] divide-y divide-brand-line overflow-y-auto">
              {rows.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    data-testid={`child-item-${c.patient_code}`}
                    onClick={() => setSelected(c.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[#F4F7F6] ${
                      active?.id === c.id ? "bg-[#FFFBEB]" : ""
                    }`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FEF3C7] text-[#92400E]">
                      <Baby className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#0B2B28]">{c.patient_name}</span>
                      <span className="block font-mono text-[11px] text-muted-foreground">{c.patient_code}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-5 lg:col-span-2">
          {!active ? (
            <Panel testid="child-detail-empty">
              <EmptyState message="Select a child" hint="Choose a record from the registry to view child details." />
            </Panel>
          ) : (
            <>
              <Panel
                title="Child Information"
                testid="child-information"
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} data-testid="edit-child-button">
                      Edit Information
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setToDelete(active)} data-testid="delete-child-button">
                      Delete
                    </Button>
                  </div>
                }
              >
                <div className="mb-5 flex items-center gap-4 rounded-xl bg-[#FFFBEB] p-4">
                  <span className="grid size-14 place-items-center rounded-full bg-[#FEF3C7] text-[#92400E]">
                    <Baby className="size-7" />
                  </span>
                  <div>
                    <p className="font-heading text-lg font-bold text-[#0B2B28]" data-testid="child-name">{active.patient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {active.patient_age} years old &middot; <span className="font-mono">{active.patient_code}</span>
                    </p>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Date of Birth" value={active.birth_date} />
                  <Field label="Age" value={`${active.patient_age} years`} />
                  <Field label="Sex" value={active.sex} />
                  <Field label="Birth Weight" value={`${active.birth_weight} kg`} />
                  <Field label="Current Weight" value={`${active.current_weight} kg`} />
                  <Field label="Blood Type" value={active.blood_type} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Mother's Name" value={active.mother_name} />
                  </div>
                </div>
              </Panel>

              <Panel
                title="Immunization Record"
                description="DOH Expanded Program on Immunization"
                className="[&>div]:p-0"
                testid="immunization-panel"
                action={
                  <Button size="sm" onClick={() => setImmOpen(true)} data-testid="add-immunization-button">
                    <Syringe className="size-3.5" /> Add Immunization Record
                  </Button>
                }
              >
                {(shots ?? []).length === 0 ? (
                  <EmptyState message="No immunizations recorded" hint="Log the child's first vaccine to start the EPI record." />
                ) : (
                  <Table data-testid="immunization-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vaccine</TableHead>
                        <TableHead>Date Given</TableHead>
                        <TableHead>Administered By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(shots ?? []).map((s) => (
                        <TableRow key={s.id} data-testid={`immunization-row-${s.id}`}>
                          <TableCell className="font-medium">{s.vaccine_name}</TableCell>
                          <TableCell className="whitespace-nowrap">{s.date_given}</TableCell>
                          <TableCell className="text-muted-foreground">{s.administered_by}</TableCell>
                          <TableCell className="text-right">
                            <button
                              type="button"
                              onClick={() => delShot.mutate(s.id)}
                              data-testid={`delete-immunization-${s.id}`}
                              aria-label={`Remove ${s.vaccine_name}`}
                              className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FFE4E6] hover:text-[#BE123C]"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </TableCell>
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

      <ChildDialog open={addOpen} onOpenChange={setAddOpen} />
      {active && <ChildDialog open={editOpen} onOpenChange={setEditOpen} child={active} />}
      {active && <ImmunizationDialog open={immOpen} onOpenChange={setImmOpen} childId={active.id} />}
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete child record?"
        description={`This removes the child record for ${toDelete?.patient_name ?? ""} and all immunization entries.`}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        pending={del.isPending}
      />
    </>
  );
}

function ChildDialog({
  open, onOpenChange, child,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  child?: Child;
}) {
  const qc = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [mother, setMother] = useState(child?.mother_name ?? "");
  const [birthWeight, setBirthWeight] = useState(String(child?.birth_weight ?? ""));
  const [currentWeight, setCurrentWeight] = useState(String(child?.current_weight ?? ""));
  const [error, setError] = useState("");

  const { data: patients } = useQuery<PatientPage>({
    queryKey: ["patients", "child-options"],
    queryFn: () => apiGet<PatientPage>("/patients?page_size=100"),
    enabled: open && !child,
  });
  const options: Patient[] = patients?.items ?? [];

  const save = useMutation({
    mutationFn: () => {
      const body = {
        mother_name: mother,
        birth_weight: Number(birthWeight) || 0,
        current_weight: Number(currentWeight) || 0,
      };
      return child
        ? apiPut<Child>(`/children/${child.id}`, body)
        : apiPost<Child>("/children", { ...body, patient_id: patientId });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["children"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(child ? "Child information updated" : "Child record added");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save the child record.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="child-dialog">
        <DialogHeader>
          <DialogTitle>{child ? "Edit Child Information" : "Add Child Record"}</DialogTitle>
          <DialogDescription>Pediatric details for growth and immunization monitoring.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          data-testid="child-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!child && !patientId) return setError("Please select a patient.");
            save.mutate();
          }}
        >
          {!child && (
            <div className="space-y-1.5">
              <Label>Patient *</Label>
              <Select value={patientId} onValueChange={(v: string) => setPatientId(v)}>
                <SelectTrigger data-testid="child-patient-select">
                  <SelectValue placeholder="Select a patient">
                    {(v) => options.find((o) => o.id === v)?.full_name ?? "Select a patient"}
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
          <div className="space-y-1.5">
            <Label htmlFor="mother">Mother&apos;s Name</Label>
            <Input id="mother" data-testid="child-mother-input" value={mother} onChange={(e) => setMother(e.target.value)} placeholder="Corazon Santos-Reyes" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bw">Birth Weight (kg)</Label>
              <Input id="bw" type="number" step="0.01" min={0} data-testid="child-birthweight-input" value={birthWeight} onChange={(e) => setBirthWeight(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cw">Current Weight (kg)</Label>
              <Input id="cw" type="number" step="0.01" min={0} data-testid="child-currentweight-input" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
            </div>
          </div>
          {error && <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="child-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} data-testid="child-form-submit">
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImmunizationDialog({
  open, onOpenChange, childId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  childId: string;
}) {
  const qc = useQueryClient();
  const [vaccine, setVaccine] = useState("BCG");
  const [dateGiven, setDateGiven] = useState("");
  const [error, setError] = useState("");

  const save = useMutation({
    mutationFn: () =>
      apiPost<Immunization>("/immunizations", { child_id: childId, vaccine_name: vaccine, date_given: dateGiven }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["immunizations"] });
      toast.success("Immunization recorded");
      setDateGiven("");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save the immunization record.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="immunization-dialog">
        <DialogHeader>
          <DialogTitle>Add Immunization Record</DialogTitle>
          <DialogDescription>Log a vaccine dose administered at the health center.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          data-testid="immunization-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!dateGiven) return setError("Date given is required.");
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Vaccine</Label>
            <Select value={vaccine} onValueChange={(v: string) => setVaccine(v)}>
              <SelectTrigger data-testid="immunization-vaccine-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VACCINE_OPTIONS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dg">Date Given *</Label>
            <Input id="dg" type="date" data-testid="immunization-date-input" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="immunization-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} data-testid="immunization-form-submit">
              {save.isPending ? "Saving..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
