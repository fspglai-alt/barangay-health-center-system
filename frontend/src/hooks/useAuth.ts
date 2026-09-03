import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { User } from "@/lib/types";

export function useAuth() {
  const q = useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: () => apiGet<User>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });
  return {
    user: q.data ?? null,
    isLoading: q.isLoading,
    isAdmin: q.data?.role === "administrator",
  };
}
