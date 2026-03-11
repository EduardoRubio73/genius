import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

interface CreditModalProps {
  type: "no_credits" | "trial_expired" | "suspended";
  onClose: () => void;
}

const config = {
  no_credits: {
    icon: "💳",
    title: "Sem cotas disponíveis",
    desc: "Você atingiu o limite de cotas do período. Compre um pacote avulso (a partir de R$4,99) ou faça upgrade do seu plano para continuar gerando.",
  },
  trial_expired: {
    icon: "⏰",
    title: "Trial expirado",
    desc: "Seu período de teste de 7 dias terminou. Faça upgrade para um plano pago para continuar usando o Prompt Genius e suas cotas mensais.",
  },
  suspended: {
    icon: "🚫",
    title: "Conta suspensa",
    desc: "Sua conta está suspensa. Entre em contato com o suporte para mais informações.",
  },
};

export function CreditModal({ type, onClose }: CreditModalProps) {
  const navigate = useNavigate();
  const { icon, title, desc } = config[type];

  return (
    <div className="misto-modal-overlay fixed inset-0 z-[400] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="misto-modal-content relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted transition-all"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="misto-modal-icon">{icon}</div>
        <div className="misto-modal-title">{title}</div>
        <div className="misto-modal-desc">{desc}</div>
        <div className="misto-modal-actions">
          <button className="misto-btn-sm" onClick={onClose}>
            Fechar
          </button>
          {type !== "suspended" && (
            <button
              className="misto-btn-sm misto-btn-sm-g"
              onClick={() => navigate("/dashboard")}
            >
              Ver planos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
