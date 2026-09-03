import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Baby, HeartPulse, Lock, ShieldCheck, Stethoscope, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { User } from "@/lib/types";

const HERO =
  "https://images.unsplash.com/photo-1638202993928-7267aad84c31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxoZWFsdGhjYXJlJTIwZG9jdG9yJTIwY2xpbmljfGVufDB8fHx8MTc4ODQ2Mjg3M3ww&ixlib=rb-4.1.0&q=85";

const MISSION = [
  { icon: HeartPulse, label: "Zero Maternal Mortality", note: "Prenatal tracking for every expectant mother" },
  { icon: Baby, label: "100% Child Immunization", note: "Complete EPI schedule monitoring" },
  { icon: ShieldCheck, label: "Secure Health Records", note: "Role-based access for authorized staff" },
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = useMutation({
    mutationFn: (body: { username: string; password: string }) => apiPost<User>("/auth/login", body),
    onSuccess: (user) => {
      beginSession();
      toast.success(`Welcome back, ${user.full_name}`);
      navigate("/dashboard", { replace: true });
    },
    onError: (err: unknown) => {
      const detail =
        err instanceof ApiError && err.body && typeof err.body === "object" && "detail" in err.body
          ? String((err.body as { detail: unknown }).detail)
          : "Unable to reach the health center server. Please try again.";
      setError(detail);
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter both your username and password.");
      return;
    }
    login.mutate({ username: username.trim(), password });
  }

  function fillDemo(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2" data-testid="login-page">
      {/* Left hero */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src={HERO} alt="Barangay health center clinic" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,43,40,0.94)_0%,rgba(15,118,110,0.88)_100%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-brand-gold">
              <Stethoscope className="size-7 text-brand-ink" strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <p className="font-heading text-lg font-bold text-white">Barangay San Isidro</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[#C2E8E3]">Health Center</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="font-heading text-4xl font-bold leading-tight text-white">
              Complete health records for every resident.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#C2E8E3]">
              Patient profiling, maternal care, child immunization and consultation history — organized in
              one secure barangay system.
            </p>
            <ul className="mt-8 space-y-4">
              {MISSION.map((m) => (
                <li key={m.label} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-white/12 ring-1 ring-white/20">
                    <m.icon className="size-[18px] text-[#FBBF24]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{m.label}</p>
                    <p className="text-xs text-[#C2E8E3]">{m.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FBBF24]">Emergency Hotline</p>
            <p className="font-heading text-xl font-bold text-white">(043) 723-9110 &middot; 0917-555-0100</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-brand-gold">
              <Stethoscope className="size-6 text-brand-ink" strokeWidth={2.4} />
            </div>
            <p className="font-heading text-base font-bold text-[#0B2B28]">Barangay Health Center</p>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-7 shadow-sm md:p-8">
            <div className="mb-6 hidden size-14 place-items-center rounded-2xl bg-brand-gold lg:grid">
              <Stethoscope className="size-8 text-brand-ink" strokeWidth={2.4} />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#0B2B28]">Sign in to your account</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Patient Profiling and Record Management System
            </p>

            <div className="mt-6 rounded-xl bg-[#EEF4F3] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quick demo access
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="demo-admin-btn"
                  onClick={() => fillDemo("admin", "admin123")}
                  className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0B2B28] ring-1 ring-brand-line transition-colors hover:bg-[#CCFBF1]"
                >
                  Administrator
                </button>
                <button
                  type="button"
                  data-testid="demo-worker-btn"
                  onClick={() => fillDemo("healthworker", "worker123")}
                  className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0B2B28] ring-1 ring-brand-line transition-colors hover:bg-[#CCFBF1]"
                >
                  Health Worker
                </button>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4" data-testid="login-form">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    data-testid="login-username-input"
                    className="pl-9"
                    placeholder="e.g. admin"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    data-testid="login-password-input"
                    className="pl-9"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p
                  className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]"
                  data-testid="login-error"
                >
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Dialog>
                  <DialogTrigger
                    render={
                      <button
                        type="button"
                        data-testid="forgot-password-link"
                        className="text-xs font-semibold text-brand-teal-dark hover:underline"
                      >
                        Forgot password?
                      </button>
                    }
                  />
                  <DialogContent className="sm:max-w-md" data-testid="forgot-password-dialog">
                    <DialogHeader>
                      <DialogTitle>Password assistance</DialogTitle>
                      <DialogDescription>
                        For security, passwords are reset by the health center administrator. Please contact
                        the Administrator or the Municipal Health Office at (043) 723-9110 to have your
                        credentials reissued.
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold"
                disabled={login.isPending}
                data-testid="login-submit-button"
              >
                {login.isPending ? "Signing in..." : "Login"}
              </Button>
            </form>

            <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-teal" />
              Only authorized health workers and administrators can access this system. All activity is
              logged in accordance with the Philippine Data Privacy Act.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
