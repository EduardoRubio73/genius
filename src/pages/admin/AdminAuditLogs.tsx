import { useState } from "react";
import { useAdminAuditLogs } from "@/hooks/admin/useAdminData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const filterOptions = [
  { value: "all", label: "Todos" },
  { value: "prompt_memory", label: "Prompts" },
  { value: "saas_specs", label: "SaaS Specs" },
  { value: "billing", label: "Billing" },
  { value: "admin_settings", label: "Admin Settings" },
];

function getActionColor(action: string) {
  if (action.includes("insert")) return "bg-green-500/12 text-green-400 border-green-500/20";
  if (action.includes("update")) return "bg-blue-500/12 text-blue-400 border-blue-500/20";
  if (action.includes("delete")) return "bg-red-500/12 text-red-400 border-red-500/20";
  return "bg-white/[0.05] text-white/50 border-white/10";
}

export default function AdminAuditLogs() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("all");
  const { data: logs, isLoading } = useAdminAuditLogs(page, filter);
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Logs e Auditoria</h2>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
          <SelectTrigger className="w-48 border-white/10 bg-[#16161F] text-[12px] text-[#E8E6F0]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#16161F] text-[#E8E6F0]">
            {filterOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-[12px]">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Timestamp", "Ação", "Recurso", "ID", "User ID"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-white/40">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[12px] text-white/30">Carregando...</td></tr>
            )}
            {logs?.map((log) => (
              <tr key={log.id} className="border-b border-white/[0.06] last:border-0 hover:bg-[#16161F] transition">
                <td className="px-5 py-2.5 text-[11px] text-white/40" style={mono}>
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </td>
                <td className="px-5 py-2.5">
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-[12px] text-white/65">{log.resource_type || "—"}</td>
                <td className="px-5 py-2.5 text-[10px] text-white/30" style={mono}>{log.resource_id?.slice(0, 12) || "—"}</td>
                <td className="px-5 py-2.5 text-[10px] text-white/30" style={mono}>{log.user_id?.slice(0, 12) || "system"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}
          className="border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]">← Anterior</Button>
        <span className="text-[12px] text-white/40" style={mono}>Página {page + 1}</span>
        <Button variant="outline" size="sm" disabled={!logs || logs.length < 50} onClick={() => setPage((p) => p + 1)}
          className="border-white/10 bg-transparent text-[12px] text-white/65 hover:bg-[#16161F]">Próximo →</Button>
      </div>
    </div>
  );
}
