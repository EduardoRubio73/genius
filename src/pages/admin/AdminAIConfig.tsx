import { useState } from "react";
import { useAdminSettings, useUpsertSetting, useAdminFeatureFlags, useToggleFeatureFlag } from "@/hooks/admin/useAdminData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminAIConfig() {
  const { data: settings, isLoading } = useAdminSettings();
  const { data: flags } = useAdminFeatureFlags();
  const upsertSetting = useUpsertSetting();
  const toggleFlag = useToggleFeatureFlag();
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const startEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (!editingKey) return;
    try {
      await upsertSetting.mutateAsync({ p_key: editingKey, p_value: editValue });
      toast({ title: "Salvo", description: `${editingKey} atualizado.` });
      setEditingKey(null);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleToggle = async (flag: string, currentEnabled: boolean) => {
    try {
      await toggleFlag.mutateAsync({ flag, enabled: !currentEnabled });
      toast({ title: "Flag atualizada" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-lg font-semibold">Configurações de IA</h2>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <span className="text-[13px] font-semibold">Settings</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {isLoading && <div className="px-5 py-8 text-center text-[12px] text-white/30">Carregando...</div>}
          {settings?.map((s) => (
            <div key={s.key} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-orange-300" style={mono}>{s.key}</div>
                <div className="text-[12px] text-white/40 mt-0.5">{s.description || "—"}</div>
              </div>
              {editingKey === s.key ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-7 w-48 border-white/10 bg-[#16161F] text-[12px] text-[#E8E6F0]"
                    style={mono}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveEdit} className="h-7 bg-orange-500 text-[11px] text-black hover:bg-orange-400">
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)} className="h-7 text-[11px] text-white/50">
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className="cursor-pointer rounded-md border border-white/10 bg-[#16161F] px-2.5 py-1 text-[12px]"
                    style={mono}
                    onClick={() => {
                      if (s.is_secret && !revealedKeys.has(s.key)) {
                        setRevealedKeys((prev) => new Set(prev).add(s.key));
                      }
                    }}
                  >
                    {s.is_secret && !revealedKeys.has(s.key) ? "••••••••••••" : s.value}
                  </div>
                  <button
                    onClick={() => startEdit(s.key, s.value)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#16161F] text-[12px] text-white/40 transition hover:border-orange-500/50 hover:text-orange-400"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <h2 className="text-lg font-semibold">Feature Flags</h2>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <div className="divide-y divide-white/[0.06]">
          {flags?.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-[13px] font-medium">{f.label}</div>
                <div className="text-[12px] text-white/40 mt-0.5">{f.description || f.flag}</div>
              </div>
              <button
                onClick={() => handleToggle(f.flag, f.enabled)}
                className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${
                  f.enabled ? "bg-green-500" : "border border-white/10 bg-[#1C1C28]"
                }`}
              >
                <div
                  className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-[left] ${
                    f.enabled ? "left-[21px]" : "left-[3px]"
                  }`}
                />
              </button>
            </div>
          ))}
          {(!flags || flags.length === 0) && (
            <div className="px-5 py-8 text-center text-[12px] text-white/30">Nenhuma flag configurada</div>
          )}
        </div>
      </div>
    </div>
  );
}
