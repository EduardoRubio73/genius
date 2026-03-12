import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function BillingSuccess() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);

  const orgId = profile?.personal_org_id;

  // Invalidate billing caches immediately and poll for updates
  useEffect(() => {
    if (!orgId) return;

    // Invalidate immediately
    queryClient.invalidateQueries({ queryKey: ["quota-balance", orgId] });
    queryClient.invalidateQueries({ queryKey: ["org-subscription", orgId] });
    queryClient.invalidateQueries({ queryKey: ["org-dashboard", orgId] });

    // Poll every 3s for up to 30s to catch async webhook updates
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["quota-balance", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["org-subscription", orgId] }),
        queryClient.invalidateQueries({ queryKey: ["org-dashboard", orgId] }),
      ]);

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setConfirmed(true);
      }
    }, 3000);

    // Mark as confirmed after a short initial delay
    const timeout = setTimeout(() => setConfirmed(true), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [orgId, queryClient]);

  return (
    <AppShell
      userName={profile?.full_name}
      userEmail={profile?.email}
      avatarUrl={profile?.avatar_url}
      onSignOut={signOut}
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
        {!confirmed ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Processando pagamento...</h1>
            <p className="text-muted-foreground max-w-md">
              Aguarde enquanto confirmamos seu pagamento. Isso pode levar alguns segundos.
            </p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Pagamento realizado com sucesso!</h1>
            <p className="text-muted-foreground max-w-md">
              Seus créditos foram atualizados. Aproveite a plataforma!
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/dashboard">Ir para o Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/profile?tab=billing">Ver meu plano</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
