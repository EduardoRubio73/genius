import { useAdminFeatureFlags, useToggleFeatureFlag } from "@/hooks/admin/useAdminData";
import { useToast } from "@/hooks/use-toast";

export default function AdminFlags() {
  const { data: flags } = useAdminFeatureFlags();
  const toggleFlag = useToggleFeatureFlag();
  const { toast } = useToast();

  const handleToggle = async (flag: string, currentEnabled: boolean) => {
    try {
      await toggleFlag.mutateAsync({ flag, enabled: !currentEnabled });
      toast({ title: "Flag atualizada" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <h2 className="text-lg font-semibold">Feature Flags</h2>

      <div className="overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0F0F17]">
        <div className="divide-y divide-white/[0.06]">
          {flags?.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex-1">
                <div className="text-[13px] font-medium">{f.label}</div>
                <div className="text-[12px] text-white/40 mt-0.5">{f.description || f.flag}</div>
                <div className="text-[10px] text-orange-400/60 mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {f.flag} · rollout: {f.rollout_pct}%
                </div>
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
            <div className="px-5 py-10 text-center text-[12px] text-white/30">Nenhuma flag configurada. Adicione via SQL.</div>
          )}
        </div>
      </div>
    </div>
  );
}
