import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  conversation_type: "master" | "skill";
  skill: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    const convos = (data ?? []) as unknown as Conversation[];

    // Auto-create Master Control Channel if missing
    let master = convos.find((c) => c.conversation_type === "master");
    if (!master) {
      const { data: newMaster } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: "Master Control",
          conversation_type: "master",
          pinned: true,
        })
        .select()
        .single();
      if (newMaster) {
        master = newMaster as unknown as Conversation;
        convos.unshift(master);
      }
    }

    setConversations(convos);
    if (!activeId && master) setActiveId(master.id);
    setLoading(false);
  }, [user, activeId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createConversation = useCallback(
    async (title: string, skill?: string) => {
      if (!user) return null;
      const { data } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title,
          conversation_type: "skill",
          skill: skill || null,
        })
        .select()
        .single();
      if (data) {
        const convo = data as unknown as Conversation;
        setConversations((prev) => {
          const pinned = prev.filter((c) => c.pinned);
          const rest = prev.filter((c) => !c.pinned);
          return [...pinned, convo, ...rest];
        });
        setActiveId(convo.id);
        return convo;
      }
      return null;
    },
    [user]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      await supabase.from("conversations").delete().eq("id", id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        const master = conversations.find((c) => c.conversation_type === "master");
        setActiveId(master?.id ?? null);
      }
    },
    [activeId, conversations]
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      await supabase.from("conversations").update({ title }).eq("id", id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    },
    []
  );

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return {
    conversations,
    activeId,
    activeConversation,
    loading,
    setActiveId,
    createConversation,
    deleteConversation,
    renameConversation,
  };
}
