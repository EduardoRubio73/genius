import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MistoFields } from "@/pages/misto/MistoMode";

interface CacheHit {
  id: string;
  prompt_gerado: string;
  especialidade: string | null;
  tarefa: string | null;
  objetivo: string | null;
  destino: string | null;
  relevance: number;
}

export function usePromptCache() {
  const [searching, setSearching] = useState(false);
  const [lastCacheHit, setLastCacheHit] = useState<CacheHit | null>(null);

  const findSimilarPrompt = useCallback(
    async (
      fields: MistoFields,
      orgId: string,
      destinoPlatform?: string
    ): Promise<CacheHit | null> => {
      const searchQuery = [
        fields.especialidade,
        fields.tarefa,
        fields.objetivo,
        fields.contexto,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (searchQuery.length < 10) {
        setLastCacheHit(null);
        return null;
      }

      setSearching(true);
      try {
        const { data, error } = await supabase.rpc("search_prompts_text", {
          search_query: searchQuery,
          filter_org_id: orgId,
          filter_destino: destinoPlatform ?? null,
          match_count: 3,
        });

        if (error || !data || data.length === 0) {
          setLastCacheHit(null);
          return null;
        }

        const best = data[0] as CacheHit;
        setLastCacheHit(best);
        return best;
      } catch {
        setLastCacheHit(null);
        return null;
      } finally {
        setSearching(false);
      }
    },
    []
  );

  return { findSimilarPrompt, searching, lastCacheHit };
}
