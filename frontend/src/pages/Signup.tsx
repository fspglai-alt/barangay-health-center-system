import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle2, ClipboardCheck, Lock, ShieldCheck, Stethoscope, User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { errText } from "@/components/PatientFormDialog";
import type { MessageResponse } from "@/lib/types";

const HERO =
  "https://images.unsplash.com/photo-1638202993928-7267aad84c31?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxoZWFsdGhjYXJlJTIwZG9jdG9yJTIwY2xpbmljfGVufDB8fHx8MTc4ODQ2Mjg3M3ww&ixlib=rb-4.1.0&q=85";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const register = useMutation({
    mutationFn: () =>
      apiPost<MessageResponse>("/auth/register", {
        full_name: fullName.trim(),
        username: username.trim(),
        password,
      }),
    onSuccess: (res) => setDone(res.message),
    onError: (e) => setError(errText(e, "Could not create your account. Please try again.")),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (fullName.trim().length < 3) return setError("Please enter your full name.");
    if (username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("The two passwords do not match.");
    register.mutate();
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2" data-testid="signup-page">
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
              Join the barangay health worker team.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#C2E8E3]">
              Request an account to help profile residents, monitor expectant mothers and keep every
              child&apos;s immunization record complete.
            </p>
            <div className="mt-8 rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#FBBF24]">
                <ClipboardCheck className="size-4" /> Approval required
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C2E8E3]">
                For patient privacy, every new account is reviewed by the health center Administrator
                before access to resident records is granted.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#8BAEA8]">
            Patient Profiling and Record Management System &middot; Version 1.0
          </p>
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
            {done ? (
              <div className="text-center" data-testid="signup-success">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#D1FAE5]">
                  <CheckCircle2 className="size-8 text-[#047857]" />
                </div>
                <h1 className="mt-4 font-heading text-2xl font-bold text-[#0B2B28]">
                  Account request submitted
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{done}</p>
                <div className="mt-5 rounded-xl bg-[#EEF4F3] px-4 py-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Your username
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#0B2B28]" data-testid="signup-success-username">
                    {username.trim().toLowerCase()}
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal-dark hover:underline"
                  data-testid="signup-back-to-login"
                >
                  <ArrowLeft className="size-4" /> Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 hidden size-14 place-items-center rounded-2xl bg-brand-gold lg:grid">
                  <Stethoscope className="size-8 text-brand-ink" strokeWidth={2.4} />
                </div>
                <h1 className="font-heading text-2xl font-bold text-[#0B2B28]">Create your account</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  For barangay health workers &middot; Administrator approval required
                </p>

                <form onSubmit={submit} className="mt-6 space-y-4" data-testid="signup-form">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="su-name"
                        data-testid="signup-fullname-input"
                        className="pl-9"
                        placeholder="e.g. Josefina Reyes, RM"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-username">Username</Label>
                    <Input
                      id="su-username"
                      data-testid="signup-username-input"
                      placeholder="e.g. jreyes"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Letters, numbers, dots and underscores only.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-pass">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="su-pass"
                        type="password"
                        data-testid="signup-password-input"
                        className="pl-9"
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="su-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="su-confirm"
                        type="password"
                        data-testid="signup-confirm-input"
                        className="pl-9"
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <p
                      className="rounded-lg bg-[#FFE4E6] px-3 py-2 text-sm font-medium text-[#BE123C]"
                      data-testid="signup-error"
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="h-11 w-full text-sm font-semibold"
                    disabled={register.isPending}
                    data-testid="signup-submit-button"
                  >
                    {register.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>

                <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-teal" />
                  New accounts are created as inactive. An Administrator must approve your account
                  before you can access resident health records.
                </p>

                <p className="mt-5 border-t border-brand-line pt-5 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-brand-teal-dark hover:underline"
                    data-testid="signup-login-link"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
