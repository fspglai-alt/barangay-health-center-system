import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function StatCard({
  title, value, icon: Icon, tone, viewAll, testid,
}: {
  title: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone: "teal" | "rose" | "amber" | "emerald";
  viewAll?: string;
  testid: string;
}) {
  const tones = {
    teal: "bg-[#CCFBF1] text-[#115E59]",
    rose: "bg-[#FCE7F3] text-[#9D174D]",
    amber: "bg-[#FEF3C7] text-[#92400E]",
    emerald: "bg-[#D1FAE5] text-[#047857]",
  };
  return (
    <div
      data-testid={testid}
      className="rounded-xl border border-brand-line bg-white p-5 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 font-heading text-4xl font-bold tracking-tight text-[#0B2B28]" data-testid={`${testid}-value`}>
        {value}
      </p>
      {viewAll && (
        <Link
          to={viewAll}
          data-testid={`${testid}-view-all`}
          className="mt-2 inline-block text-xs font-semibold text-brand-teal-dark transition-colors hover:text-brand-ink"
        >
          View All &rarr;
        </Link>
      )}
    </div>
  );
}

export function Panel({
  title, description, action, children, className, testid,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  testid?: string;
}) {
  return (
    <section
      data-testid={testid}
      className={cn("rounded-xl border border-brand-line bg-white shadow-sm", className)}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line px-5 py-4">
          <div>
            {title && <h2 className="font-heading text-base font-semibold text-[#0B2B28]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center" data-testid="empty-state">
      <Inbox className="size-8 text-[#9FBDB8]" />
      <p className="text-sm font-medium text-[#0B2B28]">{message}</p>
      {hint && <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LoadFailed({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center" data-testid="load-failed">
      <AlertTriangle className="size-8 text-[#D97706]" />
      <p className="text-sm font-medium text-[#0B2B28]">Could not load {what}</p>
      <p className="text-xs text-muted-foreground">
        The health center server is unreachable right now. Please try again shortly.
      </p>
    </div>
  );
}

export function ConfirmDelete({
  open, onOpenChange, title, description, onConfirm, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="confirm-delete-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" data-testid="confirm-delete-cancel">Cancel</Button>} />
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
            data-testid="confirm-delete-confirm"
          >
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Pager({
  page, pages, total, onChange, testid = "pager",
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (p: number) => void;
  testid?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-line px-5 py-3" data-testid={testid}>
      <p className="text-xs text-muted-foreground" data-testid={`${testid}-summary`}>
        Page {page} of {pages} &middot; {total} record{total === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline" size="sm" disabled={page <= 1}
          onClick={() => onChange(page - 1)} data-testid={`${testid}-prev`}
        >
          Previous
        </Button>
        <Button
          variant="outline" size="sm" disabled={page >= pages}
          onClick={() => onChange(page + 1)} data-testid={`${testid}-next`}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

const TYPE_TONES: Record<string, string> = {
  general: "bg-[#CCFBF1] text-[#115E59]",
  maternal: "bg-[#FCE7F3] text-[#9D174D]",
  pediatric: "bg-[#FEF3C7] text-[#92400E]",
  senior: "bg-[#E0E7FF] text-[#3730A3]",
};

export function TypeBadge({ type, label }: { type: string; label: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold", TYPE_TONES[type] ?? TYPE_TONES.general)}>
      {label}
    </span>
  );
}

export function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-medium text-[#0F2E2B]", mono && "font-mono")}>{value || "—"}</p>
    </div>
  );
}
