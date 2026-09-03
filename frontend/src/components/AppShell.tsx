import type { ReactNode } from "react";
import { useState } from "react";
import { NavLink, Navigate, useLocation } from "react-router-dom";
import {
  Baby, BarChart3, CalendarCheck, FileText, HeartPulse, LayoutDashboard,
  LogOut, Menu, Settings, ShieldCheck, Stethoscope, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { name: "Patients", path: "/patients", icon: Users, testid: "nav-patients" },
  { name: "Pregnant Women", path: "/maternal", icon: HeartPulse, testid: "nav-maternal" },
  { name: "Babies / Children", path: "/pediatric", icon: Baby, testid: "nav-pediatric" },
  { name: "Health Records", path: "/records", icon: FileText, testid: "nav-records" },
  { name: "Visit History", path: "/visits", icon: CalendarCheck, testid: "nav-visits" },
  { name: "Reports", path: "/reports", icon: BarChart3, testid: "nav-reports" },
  { name: "Users", path: "/users", icon: ShieldCheck, testid: "nav-users", adminOnly: true },
  { name: "Settings", path: "/settings", icon: Settings, testid: "nav-settings" },
];

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gold shadow-[0_6px_18px_-6px_rgba(245,158,11,0.8)]">
        <Stethoscope className="size-6 text-brand-ink" strokeWidth={2.4} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-heading text-[15px] font-bold text-white">Barangay Health Center</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#8BAEA8]">
            Patient Records System
          </p>
        </div>
      )}
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin } = useAuth();
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col bg-brand-ink">
      <div className="border-b border-[#17403B] px-5 py-5">
        <BrandMark />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" data-testid="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            data-testid={item.testid}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                "transition-[background-color,color] duration-200",
                isActive
                  ? "bg-[#134E48] text-white"
                  : "text-[#8BAEA8] hover:bg-[#163E3A] hover:text-[#F2FBF9]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("size-[18px] shrink-0", isActive && "text-brand-gold")} />
                <span className="truncate">{item.name}</span>
                {isActive && <span className="ml-auto size-1.5 rounded-full bg-brand-gold" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#17403B] p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-[#0F332F] px-3 py-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-teal text-sm font-bold text-white">
            {(user?.full_name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold text-white" data-testid="sidebar-user-name">
              {user?.full_name ?? "Loading..."}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-brand-gold">
              {user?.role === "administrator" ? "Administrator" : "Health Worker"}
            </p>
          </div>
        </div>
        <button
          type="button"
          data-testid="logout-button"
          onClick={() => void endSession("/login")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8BAEA8] transition-colors duration-200 hover:bg-[#163E3A] hover:text-white"
        >
          <LogOut className="size-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#0B2B28] md:text-[28px]" data-testid="page-title">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-brand-teal border-t-transparent" />
          Loading health center workspace...
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-brand-line bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-menu-trigger">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 border-0 p-0" showCloseButton={false}>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-sm font-semibold text-[#0B2B28]">
              Barangay San Isidro Health Center
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Patient Profiling and Record Management System
            </p>
          </div>

          <span className="hidden items-center gap-2 rounded-full bg-[#CCFBF1] px-3 py-1.5 text-xs font-semibold text-[#115E59] sm:inline-flex">
            <span className="size-1.5 rounded-full bg-[#059669]" />
            Active Shift
          </span>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-8" data-testid="main-content">
          <div className="animate-rise space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
