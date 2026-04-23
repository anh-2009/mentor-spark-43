import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const LANGUAGE_NAMES: Record<string, string> = {
  vi: "Vietnamese (Tiếng Việt)",
  en: "English",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
};

/**
 * Fetches the user's preferred language code from the `profiles` table.
 * Defaults to "vi" when not signed in or not yet loaded.
 */
export function useUserLanguage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["user-language", user?.id],
    queryFn: async () => {
      if (!user) return "vi";
      const { data } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.language ?? "vi";
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const code = data ?? "vi";
  return {
    language: code,
    languageName: LANGUAGE_NAMES[code] ?? "Vietnamese (Tiếng Việt)",
  };
}
