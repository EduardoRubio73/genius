import { Gift, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  bonusCredits?: number;
};

export default function ReferralBonusCard({ bonusCredits = 0 }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Gift className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Bônus de Indicações</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Indique um amigo e ambos ganham 5 cotas extras gratuitamente.
      </p>

      <p className="text-sm text-foreground font-medium">
        Bônus disponível: <span className="text-primary font-bold">{bonusCredits}</span>
      </p>

      <Button variant="outline" size="sm" className="w-full gap-2">
        <Share2 className="h-3.5 w-3.5" />
        Compartilhar convite
      </Button>
    </div>
  );
}
