import { useState } from "react";
import { useAdminUsers } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function PlanBadge({ tier }: { tier: string | null }) {
  const styles: Record<string, string> = {
    pro: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    starter: "bg-blue-500/12 text-blue-400 border-blue-500/25",
    enterprise: "bg-orange-500/12 text-orange-400 border-orange-500/25",
    free: "bg-white/[0.08] text-white/65 border-white/10",
  };
  const t = tier || "free";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[t] ?? styles.free}`}>
      {t}
    </span>
  );
}

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: users, isLoading } = useAdminUsers(page, debouncedSearch);
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__adminSearchTimer);
    (window as any).__adminSearchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(0);
    }, 300);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Usuários e Organizações</h2>
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64 border-white/10 bg-[#16161F] text-[13px] text-[#E8E6F0] placeholder:text-white/30"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Usuário", "Plano", "Org", "Prompts", "Specs", "Cadastro", "Status"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[12px] text-white/30">Carregando...</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.user_id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
                <td className="px-5 py-3">
                  <div className="text-[13px] font-medium">{u.full_name || "—"}</div>
                  <div className="text-[11px] text-white/40" style={mono}>{u.email}</div>
                </td>
                <td className="px-5 py-3"><PlanBadge tier={u.plan_tier} /></td>
                <td className="px-5 py-3 text-[12px] text-white/65">{u.org_name || "—"}</td>
                <td className="px-5 py-3 text-[11px] text-white/65" style={mono}>{u.total_prompts ?? 0}</td>
                <td className="px-5 py-3 text-[11px] text-white/65" style={mono}>{u.total_specs ?? 0}</td>
                <td className="px-5 py-3 text-[11px] text-white/40" style={mono}>
                  {u.registered_at ? new Date(u.registered_at).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-5 py-3">
                  {u.org_active !== false ? (
                    <span className="inline-flex rounded-md border border-green-500/20 bg-green-500/12 px-2 py-0.5 text-[11px] font-medium text-green-400">● ativo</span>
                  ) : (
                    <span className="inline-flex rounded-md border border-red-500/25 bg-red-500/12 px-2 py-0.5 text-[11px] font-medium text-red-400">✕ inativo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"
        >
          ← Anterior
        </Button>
        <span className="text-[12px] text-white/40" style={mono}>Página {page + 1}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!users || users.length < 20}
          onClick={() => setPage((p) => p + 1)}
          className="border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]"
        >
          Próximo →
        </Button>
      </div>
    </div>
  );
}
