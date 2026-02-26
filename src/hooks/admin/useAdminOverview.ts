import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminKpis() {
  return useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_kpis");
      if (error) throw error;
      return (data as any[])?.[0] ?? null;
    },
  });
}

export function useAdminRecentUsers(limit = 5) {
  return useQuery({
    queryKey: ["admin-recent-users", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_users_overview")
        .select("*")
        .order("registered_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminRecentAudit(limit = 8) {
  return useQuery({
    queryKey: ["admin-recent-audit", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminSessionChart() {
  return useQuery({
    queryKey: ["admin-session-chart"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("sessions")
        .select("created_at")
        .gte("created_at", sevenDaysAgo);
      if (error) throw error;

      // Group by day
      const counts: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        counts[d.toISOString().slice(0, 10)] = 0;
      }
      data?.forEach((s) => {
        const day = s.created_at.slice(0, 10);
        if (counts[day] !== undefined) counts[day]++;
      });

      return Object.entries(counts).map(([day, count]) => ({
        day: day.slice(5), // MM-DD
        count,
      }));
    },
  });
}
