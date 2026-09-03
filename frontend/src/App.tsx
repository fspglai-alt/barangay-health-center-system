import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppShell from "@/components/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientProfile from "@/pages/PatientProfile";
import Maternal from "@/pages/Maternal";
import Pediatric from "@/pages/Pediatric";
import Records from "@/pages/Records";
import Visits from "@/pages/Visits";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Settings from "@/pages/Settings";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/patients" element={<AppShell><Patients /></AppShell>} />
        <Route path="/patients/:id" element={<AppShell><PatientProfile /></AppShell>} />
        <Route path="/maternal" element={<AppShell><Maternal /></AppShell>} />
        <Route path="/pediatric" element={<AppShell><Pediatric /></AppShell>} />
        <Route path="/records" element={<AppShell><Records /></AppShell>} />
        <Route path="/visits" element={<AppShell><Visits /></AppShell>} />
        <Route path="/reports" element={<AppShell><Reports /></AppShell>} />
        <Route path="/users" element={<AppShell><Users /></AppShell>} />
        <Route path="/settings" element={<AppShell><Settings /></AppShell>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}
