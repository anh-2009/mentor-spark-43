import { supabase } from "@/integrations/supabase/client";

interface VaultPrompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
}

/**
 * Find relevant prompts from the vault based on keyword matching
 * against user input, conversation skill, and prompt tags/titles.
 */
export async function findRelevantPrompts(
  userId: string,
  userMessage: string,
  skill?: string | null
): Promise<string[]> {
  const { data, error } = await supabase
    .from("prompt_vault")
    .select("title, content, tags, category")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) return [];

  const prompts = data as unknown as VaultPrompt[];
  const msgLower = userMessage.toLowerCase();
  const skillLower = skill?.toLowerCase() || "";

  // Score each prompt by relevance
  const scored = prompts.map((p) => {
    let score = 0;

    // Check if any tag matches words in user message
    for (const tag of p.tags) {
      if (msgLower.includes(tag.toLowerCase())) score += 3;
      if (skillLower && tag.toLowerCase().includes(skillLower)) score += 2;
    }

    // Check if title keywords appear in message
    const titleWords = p.title.toLowerCase().split(/\s+/);
    for (const w of titleWords) {
      if (w.length > 2 && msgLower.includes(w)) score += 2;
    }

    // Category match with skill
    if (skillLower && p.category.toLowerCase().includes(skillLower)) score += 1;

    // Check content keywords (lighter weight)
    const contentWords = p.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matchedContentWords = contentWords.filter((w) => msgLower.includes(w));
    score += Math.min(matchedContentWords.length, 3); // cap at 3

    return { prompt: p, score };
  });

  // Return top 3 prompts with score > 0
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.prompt.content);
}

/**
 * Build enhanced system prompt with injected vault prompts
 */
export function buildEnhancedSystemPrompt(
  basePrompt: string,
  vaultPrompts: string[]
): string {
  if (vaultPrompts.length === 0) return basePrompt;

  const injected = vaultPrompts
    .map((p, i) => `[Vault Prompt ${i + 1}]: ${p}`)
    .join("\n");

  return `${basePrompt}\n\n--- User's Saved Knowledge ---\n${injected}\n--- End Saved Knowledge ---\n\nUse the above saved knowledge when relevant to the user's question.`;
}
