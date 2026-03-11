import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Sparkles, FileCode, Layers, Hammer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    id: string;
    mode: string;
    raw_input: string | null;
    completed: boolean;
    tokens_total: number;
    created_at: string;
    updated_at: string;
    has_output?: boolean;
  } | null;
}

const MODE_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  prompt: { label: "Prompt", icon: Sparkles, cls: "text-primary" },
  saas: { label: "SaaS Spec", icon: FileCode, cls: "text-accent" },
  misto: { label: "Misto", icon: Layers, cls: "text-secondary" },
  build: { label: "Build", icon: Hammer, cls: "text-warning" },
};

function getDuration(created: string, updated: string): string {
  const diff = new Date(updated).getTime() - new Date(created).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  return `${(mins / 60).toFixed(1)}h`;
}

export function SessionDetailDialog({ open, onOpenChange, session }: SessionDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !session) {
      setOutput(null);
      return;
    }

    const fetchOutput = async () => {
      setLoading(true);
      try {
        // Try prompt_memory first
        const { data: prompt } = await supabase
          .from("prompt_memory")
          .select("prompt_gerado")
          .eq("session_id", session.id)
          .maybeSingle();

        if (prompt?.prompt_gerado) {
          setOutput(prompt.prompt_gerado);
          setLoading(false);
          return;
        }

        // Try saas_specs
        const { data: spec } = await supabase
          .from("saas_specs")
          .select("spec_md")
          .eq("session_id", session.id)
          .maybeSingle();

        if (spec?.spec_md) {
          setOutput(spec.spec_md);
          setLoading(false);
          return;
        }

        // Try build_projects
        const { data: build } = await supabase
          .from("build_projects")
          .select("project_name")
          .eq("session_id", session.id)
          .maybeSingle();

        setOutput(build?.project_name ? `Projeto: ${build.project_name}` : null);
      } catch {
        setOutput(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOutput();
  }, [open, session]);

  if (!session) return null;

  const meta = MODE_META[session.mode] ?? MODE_META.prompt;
  const Icon = meta.icon;
  const isFinished = session.completed || session.has_output;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", meta.cls)} />
            <span>Sessão {meta.label}</span>
          </DialogTitle>
          <DialogDescription>
            {formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ptBR })} · {getDuration(session.created_at, session.updated_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Status + Tokens */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
            isFinished
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-warning/20 bg-warning/10 text-warning"
          )}>
            {isFinished ? <><CheckCircle className="h-3 w-3" /> Finalizada</> : <><Clock className="h-3 w-3" /> Em andamento</>}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {session.tokens_total.toLocaleString("pt-BR")} tokens
          </span>
        </div>

        {/* Raw Input */}
        {session.raw_input && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Entrada</p>
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
              {session.raw_input}
            </div>
          </div>
        )}

        {/* Generated Output */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resultado gerado</p>
          {loading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : output ? (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
              {output}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhum resultado encontrado para esta sessão.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
