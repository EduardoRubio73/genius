import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_super_admin").then(({ data }) => {
      setIsSuperAdmin(!!data);
    });
  }, [user]);

  if (authLoading || (user && isSuperAdmin === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090E]">
        <Skeleton className="h-12 w-48 bg-[#16161F]" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
