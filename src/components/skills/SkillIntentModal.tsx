import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SkillIntentModalProps {
  open: boolean;
  skillName: string;
  onSelect: (intent: "prompt" | "skill") => void;
  onClose: () => void;
}

export function SkillIntentModal({ open, skillName, onSelect, onClose }: SkillIntentModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <div className="skill-intent-modal">
          <DialogHeader className="skill-intent-header">
            <DialogTitle className="skill-intent-title">
              O que deseja fazer com <span className="skill-intent-skill-name">{skillName}</span>?
            </DialogTitle>
            <DialogDescription className="skill-intent-desc">
              Escolha como usar o agente selecionado
            </DialogDescription>
          </DialogHeader>

          <div className="skill-intent-cards">
            <button
              type="button"
              className="skill-intent-card skill-intent-card-prompt"
              onClick={() => onSelect("prompt")}
            >
              <div className="skill-intent-card-icon">✨</div>
              <div className="skill-intent-card-title">Gerar Prompt</div>
              <div className="skill-intent-card-desc">
                Gera um prompt otimizado usando o agente como especialista. Consulta o histórico primeiro.
              </div>
              <div className="skill-intent-card-cost">1 cota (ou 0 se do histórico)</div>
            </button>

            <button
              type="button"
              className="skill-intent-card skill-intent-card-skill"
              onClick={() => onSelect("skill")}
            >
              <div className="skill-intent-card-icon">🧠</div>
              <div className="skill-intent-card-title">Criar Skill</div>
              <div className="skill-intent-card-desc">
                Cria um agente especializado com instruções avançadas para uso direto.
              </div>
              <div className="skill-intent-card-cost">1 cota</div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
