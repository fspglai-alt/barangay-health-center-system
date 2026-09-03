import { Building2, Clock, Database, MapPin, Phone, ShieldCheck, UserCog } from "lucide-react";
import { PageHeading } from "@/components/AppShell";
import { Field, Panel } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";

const CENTER = [
  { label: "Center Name", value: "Barangay San Isidro Health Center", icon: Building2 },
  { label: "Municipality", value: "Sto. Tomas", icon: MapPin },
  { label: "Province", value: "Batangas", icon: MapPin },
  { label: "Contact Number", value: "(043) 723-9110", icon: Phone },
  { label: "Head Medical Officer", value: "Dr. Maria Elena Santos", icon: UserCog },
  { label: "Operating Hours", value: "Mon–Fri, 8:00 AM – 5:00 PM", icon: Clock },
];

export default function Settings() {
  const { user, isAdmin } = useAuth();

  return (
    <>
      <PageHeading
        title="Settings"
        subtitle="Health center profile, your account and system information."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Health Center Information" className="lg:col-span-2" testid="settings-center-info">
          <div className="grid gap-5 sm:grid-cols-2">
            {CENTER.map((c) => (
              <div key={c.label} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-[#CCFBF1] text-[#115E59]">
                  <c.icon className="size-[18px]" />
                </span>
                <Field label={c.label} value={c.value} />
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="My Account" testid="settings-my-account">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-brand-teal font-heading text-lg font-bold text-white">
                {(user?.full_name ?? "?").charAt(0)}
              </span>
              <div>
                <p className="font-heading text-sm font-bold text-[#0B2B28]" data-testid="settings-user-name">
                  {user?.full_name ?? "—"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">{user?.username ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <Field label="Role" value={isAdmin ? "Administrator" : "Health Worker"} />
              <Field label="Account Status" value={user?.status === "active" ? "Active" : "Inactive"} />
              <Field label="Member Since" value={user?.created_at?.slice(0, 10) ?? ""} />
            </div>
          </Panel>

          <Panel title="System" testid="settings-system">
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Database className="mt-0.5 size-4 shrink-0 text-brand-teal" />
                <div>
                  <p className="font-medium text-[#0F2E2B]">MongoDB Records Storage</p>
                  <p className="text-xs text-muted-foreground">
                    Patients, pregnancies, child profiles, immunizations and consultations are stored persistently.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-teal" />
                <div>
                  <p className="font-medium text-[#0F2E2B]">Role-Based Access Control</p>
                  <p className="text-xs text-muted-foreground">
                    Only Administrators may create, edit or deactivate staff accounts.
                  </p>
                </div>
              </div>
              <p className="border-t border-brand-line pt-3 text-xs text-muted-foreground">
                Patient Profiling and Record Management System &middot; Version 1.0
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
