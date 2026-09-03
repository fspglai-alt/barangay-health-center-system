import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/AppShell";
import { ConfirmDelete, EmptyState, LoadFailed, Panel } from "@/components/common";
import { errText } from "@/components/PatientFormDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { OkResponse, User } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = {
  administrator: "Administrator",
  health_worker: "Health Worker",
};

export default function Users() {
  const qc = useQueryClient();
  const { isAdmin, user: me } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const { data, isError, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => apiGet<User[]>("/users"),
  });

  const toggle = useMutation({
    mutationFn: (u: User) =>
      apiPut<User>(`/users/${u.id}`, { status: u.status === "active" ? "inactive" : "active" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated");
    },
    onError: (e) => toast.error(errText(e, "Could not update this user.")),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiDelete<OkResponse>(`/users/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
      setToDelete(null);
    },
    onError: (e) => toast.error(errText(e, "Could not delete this user.")),
  });

  const rows = data ?? [];
  const pending = rows.filter((u) => u.status !== "active");

  return (
    <>
      <PageHeading
        title="Users"
        subtitle="Health center staff accounts and role-based access."
        action={
          isAdmin ? (
            <Button onClick={() => { setEditing(null); setFormOpen(true); }} data-testid="add-user-button">
              <Plus className="size-4" /> Add User
            </Button>
          ) : undefined
        }
      />

      {isAdmin && pending.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]"
          data-testid="pending-approval-notice"
        >
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>{pending.length}</strong> account{pending.length === 1 ? "" : "s"} awaiting approval.
            Health workers who signed up themselves stay inactive until you press{" "}
            <strong>Activate</strong> on their row.
          </span>
        </div>
      )}

      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]" data-testid="users-readonly-notice">
          <ShieldCheck className="size-4 shrink-0" />
          You are signed in as a Health Worker. Staff accounts are read-only — only an Administrator can add, edit or deactivate users.
        </div>
      )}

      <Panel className="[&>div]:p-0" testid="users-panel">
        {isError ? (
          <LoadFailed what="the staff directory" />
        ) : isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading users...</p>
        ) : rows.length === 0 ? (
          <EmptyState message="No user accounts" hint="Add a staff account to grant system access." />
        ) : (
          <Table data-testid="users-table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id} data-testid={`user-row-${u.username}`}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell>{ROLE_LABELS[u.role] ?? u.role}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      u.status === "active" ? "bg-[#D1FAE5] text-[#047857]" : "bg-[#F1F5F4] text-[#566B6D]"
                    }`}>
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{u.created_at.slice(0, 10)}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline" size="xs"
                          onClick={() => toggle.mutate(u)}
                          data-testid={`toggle-user-${u.username}`}
                        >
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <button type="button" data-testid={`edit-user-${u.username}`}
                          onClick={() => { setEditing(u); setFormOpen(true); }}
                          aria-label={`Edit ${u.username}`}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FEF3C7] hover:text-[#92400E]">
                          <Pencil className="size-4" />
                        </button>
                        <button type="button" data-testid={`delete-user-${u.username}`}
                          onClick={() => setToDelete(u)} disabled={u.id === me?.id}
                          aria-label={`Delete ${u.username}`}
                          className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-[#FFE4E6] hover:text-[#BE123C] disabled:opacity-30">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-right text-xs text-muted-foreground">—</p>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <UserDialog open={formOpen} onOpenChange={setFormOpen} user={editing} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete user account?"
        description={`${toDelete?.full_name ?? "This user"} will lose access to the system immediately.`}
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        pending={del.isPending}
      />
    </>
  );
}

function UserDialog({
  open, onOpenChange, user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user?: User | null;
}) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("health_worker");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setFullName(user?.full_name ?? "");
    setUsername(user?.username ?? "");
    setRole(user?.role ?? "health_worker");
    setPassword("");
  }, [open, user]);

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, string> = { full_name: fullName, username, role };
      if (password) body.password = password;
      return user ? apiPut<User>(`/users/${user.id}`, body) : apiPost<User>("/users", body);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(user ? "User updated" : "User created");
      onOpenChange(false);
    },
    onError: (e) => setError(errText(e, "Could not save this user account.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="user-dialog">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>Staff accounts control who can access the health records system.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          data-testid="user-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            if (!fullName.trim()) return setError("Full name is required.");
            if (!username.trim()) return setError("Username is required.");
            if (!user && password.length < 6) return setError("Password must be at least 6 characters.");
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="uf-name">Full Name *</Label>
            <Input id="uf-name" data-testid="user-fullname-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Josefina Reyes, RM" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-username">Username *</Label>
            <Input id="uf-username" data-testid="user-username-input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jreyes" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uf-pass">{user ? "New Password (optional)" : "Password *"}</Label>
            <Input id="uf-pass" type="password" data-testid="user-password-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v: string) => setRole(v)}>
              <SelectTrigger data-testid="user-role-select">
                <SelectValue>{(v) => ROLE_LABELS[v as string] ?? "Health Worker"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrator">Administrator</SelectItem>
                <SelectItem value="health_worker">Health Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]" data-testid="user-form-error">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending} data-testid="user-form-submit">
              {save.isPending ? "Saving..." : "Save User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
