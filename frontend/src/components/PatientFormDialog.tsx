import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiPost, apiPut } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { PATIENT_TYPE_LABELS } from "@/lib/types";

const BLOOD_TYPES = ["Unknown", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const CIVIL = ["Single", "Married", "Widowed", "Separated"];

type Form = {
  full_name: string; birth_date: string; sex: string; civil_status: string;
  contact_number: string; address: string; blood_type: string; occupation: string;
  philhealth_number: string; patient_type: string;
};

const EMPTY: Form = {
  full_name: "", birth_date: "", sex: "Female", civil_status: "Single", contact_number: "",
  address: "", blood_type: "Unknown", occupation: "", philhealth_number: "", patient_type: "general",
};

export function errText(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body) {
    const d = (err.body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d.length) return "Please check the highlighted fields and try again.";
  }
  return fallback;
}

export default function PatientFormDialog({
  open, onOpenChange, patient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patient?: Patient | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      patient
        ? {
            full_name: patient.full_name, birth_date: patient.birth_date, sex: patient.sex,
            civil_status: patient.civil_status, contact_number: patient.contact_number,
            address: patient.address, blood_type: patient.blood_type, occupation: patient.occupation,
            philhealth_number: patient.philhealth_number, patient_type: patient.patient_type,
          }
        : EMPTY,
    );
  }, [open, patient]);

  const save = useMutation({
    mutationFn: (body: Form) =>
      patient ? apiPut<Patient>(`/patients/${patient.id}`, body) : apiPost<Patient>("/patients", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["patients"] });
      void qc.invalidateQueries({ queryKey: ["patient"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(patient ? "Patient information updated" : "Patient registered successfully");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save the patient record.")),
  });

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim()) return setError("Full name is required.");
    if (!form.birth_date) return setError("Birth date is required.");
    save.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="patient-form-dialog">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit Patient Information" : "Register New Patient"}</DialogTitle>
          <DialogDescription>
            {patient ? "Update the resident's profile details." : "Add a new resident to the barangay health center registry."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" data-testid="patient-form">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-name">Full Name *</Label>
              <Input id="pf-name" data-testid="patient-name-input" value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)} placeholder="Juan Miguel Dela Cruz" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-bd">Birth Date *</Label>
              <Input id="pf-bd" type="date" data-testid="patient-birthdate-input" value={form.birth_date}
                onChange={(e) => set("birth_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={(v: string) => set("sex", v)}>
                <SelectTrigger data-testid="patient-sex-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Civil Status</Label>
              <Select value={form.civil_status} onValueChange={(v: string) => set("civil_status", v)}>
                <SelectTrigger data-testid="patient-civil-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CIVIL.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Patient Type</Label>
              <Select value={form.patient_type} onValueChange={(v: string) => set("patient_type", v)}>
                <SelectTrigger data-testid="patient-type-select">
                  <SelectValue>{(v) => PATIENT_TYPE_LABELS[v as string] ?? "General"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PATIENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-contact">Contact Number</Label>
              <Input id="pf-contact" data-testid="patient-contact-input" value={form.contact_number}
                onChange={(e) => set("contact_number", e.target.value)} placeholder="0917-555-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Blood Type</Label>
              <Select value={form.blood_type} onValueChange={(v: string) => set("blood_type", v)}>
                <SelectTrigger data-testid="patient-blood-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-occ">Occupation</Label>
              <Input id="pf-occ" data-testid="patient-occupation-input" value={form.occupation}
                onChange={(e) => set("occupation", e.target.value)} placeholder="Tricycle Driver" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-ph">PhilHealth Number</Label>
              <Input id="pf-ph" data-testid="patient-philhealth-input" value={form.philhealth_number}
                onChange={(e) => set("philhealth_number", e.target.value)} placeholder="12-345678901-2" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pf-addr">Address</Label>
              <Textarea id="pf-addr" rows={2} data-testid="patient-address-input" value={form.address}
                onChange={(e) => set("address", e.target.value)} placeholder="Purok 1, Brgy. San Isidro" />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="patient-form-error">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="patient-form-cancel">
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending} data-testid="patient-form-submit">
              {save.isPending ? "Saving..." : patient ? "Save Changes" : "Register Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
