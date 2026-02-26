import { useState } from "react";
import { useAdminPrompts } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPrompts() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: prompts, isLoading } = useAdminPrompts(page, debouncedSearch);
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__adminPromptSearch);
    (window as any).__adminPromptSearch = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(0);
    }, 300);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prompts e Specs</h2>
        <Input
          placeholder="Buscar tarefa ou especialidade..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-64 border-white/10 bg-[#16161F] text-[13px] text-[#E8E6F0] placeholder:text-white/30"
        />
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Usuário", "Org", "Especialidade", "Tarefa", "Destino", "Rating", "Tokens", "Data"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-[12px] text-white/30">Carregando...</td></tr>
            )}
            {prompts?.map((p, i) => (
              <tr key={`${p.id}-${i}`} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
                <td className="px-4 py-3">
                  <div className="text-[12px] font-medium">{p.user_name || "—"}</div>
                  <div className="text-[10px] text-white/40" style={mono}>{p.user_email}</div>
                </td>
                <td className="px-4 py-3 text-[12px] text-white/65">{p.org_name || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-white/65">{p.especialidade || "—"}</td>
                <td className="px-4 py-3 text-[12px] text-white/65 max-w-[160px] truncate">{p.tarefa || "—"}</td>
                <td className="px-4 py-3">
                  {p.destino && (
                    <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px]">{p.destino}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[12px] text-white/65" style={mono}>{p.rating ?? "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/40" style={mono}>{p.tokens_consumed ?? "—"}</td>
                <td className="px-4 py-3 text-[11px] text-white/40" style={mono}>
                  {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
          className="border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]">← Anterior</Button>
        <span className="text-[12px] text-white/40" style={mono}>Página {page + 1}</span>
        <Button variant="outline" size="sm" disabled={!prompts || prompts.length < 20} onClick={() => setPage((p) => p + 1)}
          className="border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]">Próximo →</Button>
      </div>
    </div>
  );
}
