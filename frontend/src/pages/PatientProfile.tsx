import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeading } from "@/components/AppShell";
import { EmptyState, Field, LoadFailed, Panel, TypeBadge } from "@/components/common";
import PatientFormDialog from "@/components/PatientFormDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet } from "@/lib/api";
import type { HealthRecord, Patient } from "@/lib/types";
import { PATIENT_TYPE_LABELS } from "@/lib/types";

export default function PatientProfile() {
  const { id = "" } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data: patient, isError } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: () => apiGet<Patient>(`/patients/${id}`),
    enabled: !!id,
  });

  const { data: records } = useQuery<HealthRecord[]>({
    queryKey: ["patient", id, "records"],
    queryFn: () => apiGet<HealthRecord[]>(`/patients/${id}/records`),
    enabled: !!id,
  });

  if (isError) {
    return (
      <Panel testid="patient-profile-error">
        <LoadFailed what="this patient profile" />
        <div className="flex justify-center">
          <Link to="/patients" className="text-sm font-semibold text-brand-teal-dark hover:underline">
            Back to Patients
          </Link>
        </div>
      </Panel>
    );
  }

  const rows = records ?? [];

  return (
    <>
      <Link
        to="/patients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-teal-dark"
        data-testid="back-to-patients"
      >
        <ArrowLeft className="size-4" /> Back to Patients
      </Link>

      <PageHeading
        title={patient?.full_name ?? "Patient Profile"}
        subtitle={patient ? `Patient ID ${patient.patient_id}` : "Loading patient record..."}
        action={
          <Button onClick={() => setEditOpen(true)} disabled={!patient} data-testid="edit-information-button">
            <Pencil className="size-4" /> Edit Information
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-brand-line bg-white p-6 text-center shadow-sm" data-testid="patient-profile-panel">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-brand-teal font-heading text-2xl font-bold text-white">
              {(patient?.full_name ?? "?").charAt(0)}
            </div>
            <p className="mt-3 font-heading text-lg font-bold text-[#0B2B28]" data-testid="profile-full-name">
              {patient?.full_name ?? "—"}
            </p>
            <p className="font-mono text-xs text-muted-foreground" data-testid="profile-patient-id">
              {patient?.patient_id ?? "—"}
            </p>
            <div className="mt-3">
              {patient && <TypeBadge type={patient.patient_type} label={PATIENT_TYPE_LABELS[patient.patient_type] ?? "General"} />}
            </div>
            <dl className="mt-5 space-y-3 border-t border-brand-line pt-5 text-left">
              <Field label="Age" value={patient ? `${patient.age} years old` : ""} />
              <Field label="Sex" value={patient?.sex ?? ""} />
              <Field label="Blood Type" value={patient?.blood_type ?? ""} />
              <Field label="Contact" value={patient?.contact_number ?? ""} />
            </dl>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <Tabs defaultValue="overview">
            <TabsList variant="line" data-testid="profile-tabs">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="records" data-testid="tab-health-records">Health Records</TabsTrigger>
              <TabsTrigger value="visits" data-testid="tab-visit-history">Visit History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-5">
              <Panel title="Personal Information" testid="personal-information">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Full Name" value={patient?.full_name ?? ""} />
                  <Field label="Birth Date" value={patient?.birth_date ?? ""} />
                  <Field label="Age" value={patient ? String(patient.age) : ""} />
                  <Field label="Sex" value={patient?.sex ?? ""} />
                  <Field label="Civil Status" value={patient?.civil_status ?? ""} />
                  <Field label="Contact Number" value={patient?.contact_number ?? ""} />
                  <div className="sm:col-span-2 lg:col-span-3">
                    <Field label="Address" value={patient?.address ?? ""} />
                  </div>
                </div>
              </Panel>

              <Panel title="Other Information" testid="other-information">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Blood Type" value={patient?.blood_type ?? ""} />
                  <Field label="Occupation" value={patient?.occupation ?? ""} />
                  <Field label="PhilHealth Number" value={patient?.philhealth_number ?? ""} mono />
                  <Field label="Date Registered" value={patient?.created_at?.slice(0, 10) ?? ""} />
                  <Field label="Registered By" value={patient?.registered_by ?? ""} />
                  <Field label="Patient Type" value={patient ? PATIENT_TYPE_LABELS[patient.patient_type] : ""} />
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="records" className="mt-5">
              <Panel title="Health Records" description="Clinical consultations and diagnoses" className="[&>div]:p-0" testid="profile-health-records">
                {rows.length === 0 ? (
                  <EmptyState message="No health records yet" hint="Add a health record from the Health Records page." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Record ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Diagnosis</TableHead>
                        <TableHead>Health Worker</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.id} data-testid={`profile-record-${r.record_id}`}>
                          <TableCell className="font-mono text-xs">{r.record_id}</TableCell>
                          <TableCell className="whitespace-nowrap">{r.consultation_date}</TableCell>
                          <TableCell>{r.consultation_type}</TableCell>
                          <TableCell className="text-muted-foreground">{r.diagnosis || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{r.health_worker}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Panel>
            </TabsContent>

            <TabsContent value="visits" className="mt-5">
              <Panel title="Visit History" description="Chronological consultation log" testid="profile-visit-history">
                {rows.length === 0 ? (
                  <EmptyState message="No visits recorded" hint="Consultations logged for this patient will appear here." />
                ) : (
                  <ol className="relative space-y-5 border-l border-brand-line pl-6">
                    {rows.map((r) => (
                      <li key={r.id} data-testid={`profile-visit-${r.record_id}`}>
                        <span className="absolute -left-[7px] mt-1.5 size-3.5 rounded-full border-2 border-white bg-brand-teal" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {r.consultation_date} &middot; {r.consultation_type}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-[#0F2E2B]">{r.chief_complaint || "Routine visit"}</p>
                        <p className="text-xs text-muted-foreground">Attended by {r.health_worker}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PatientFormDialog open={editOpen} onOpenChange={setEditOpen} patient={patient ?? null} />
    </>
  );
}
