import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { streamChat, type Msg } from "@/lib/streamChat";
import { detectSentiment } from "@/lib/sentiment";
import { parseRoadmapIntent, executeRoadmapAction, parseScheduleIntent, executeScheduleAction, parseProgressIntent, executeProgressAction, parseDeleteRoadmapIntent, executeDeleteRoadmapAction, parseListGoalsIntent, executeListGoalsAction } from "@/lib/masterActions";
import { findRelevantPrompts, buildEnhancedSystemPrompt } from "@/lib/promptVault";
import Navbar from "@/components/Navbar";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import { useConversations } from "@/hooks/useConversations";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";

export default function Chat() {
  const { user, session } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const {
    conversations,
    activeId,
    activeConversation,
    loading: convosLoading,
    setActiveId,
    createConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load messages for active conversation
  const loadMessages = useCallback(async () => {
    if (!user || !activeId) { setMessages([]); return; }
    setLoadingHistory(true);
    const { data } = await supabase
      .from("chat_history")
      .select("role, message")
      .eq("user_id", user.id)
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .limit(100);
    setMessages(
      (data ?? []).map((m) => ({ role: m.role as Msg["role"], content: m.message }))
    );
    setLoadingHistory(false);
  }, [user, activeId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading || !session || !activeId) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const sentiment = detectSentiment(userMsg.content);
    const isMasterChannel = activeConversation?.conversation_type === "master";

    // Check for roadmap intent in master channel
    if (isMasterChannel) {
      // Check for roadmap intent
      const roadmapAction = parseRoadmapIntent(text);
      if (roadmapAction && session) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⏳ Đang tạo roadmap **${roadmapAction.skill}** (${roadmapAction.level}, ${roadmapAction.weeks} tuần)...` }]);

        const result = await executeRoadmapAction(roadmapAction, user!.id, session.access_token);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: result.success
              ? `✅ Đã tạo roadmap **${roadmapAction.skill}** thành công!\n\n- 📚 Kỹ năng: **${roadmapAction.skill}**\n- 📊 Level: **${roadmapAction.level}**\n- 📅 Thời gian: **${roadmapAction.weeks} tuần**\n\n👉 Vào trang **Roadmap** để xem chi tiết milestones, KPIs và risk analysis.`
              : `❌ Lỗi tạo roadmap: ${result.error}. Vui lòng thử lại.`
          };
          return updated;
        });

        if (result.success) {
          toast.success(`Đã tạo roadmap ${roadmapAction.skill}!`);
          queryClient.invalidateQueries({ queryKey: ["goals"] });
        }

        await supabase.from("chat_history").insert([
          { user_id: user!.id, role: "user", message: userMsg.content, sentiment, conversation_id: activeId },
          { user_id: user!.id, role: "assistant", message: result.success ? `Đã tạo roadmap ${roadmapAction.skill} thành công.` : `Lỗi: ${result.error}`, sentiment: "neutral", conversation_id: activeId },
        ]);

        if (messages.length === 0 && activeConversation?.title === "New Chat") {
          renameConversation(activeId, text.slice(0, 40) + (text.length > 40 ? "..." : ""));
        }

        setIsLoading(false);
        return;
      }

      // Check for progress intent
      const progressAction = parseProgressIntent(text);
      if (progressAction) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⏳ Đang tổng hợp tiến độ học tập...` }]);

        const result = await executeProgressAction(user!.id);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: result.success ? result.summary! : `❌ ${result.error}`
          };
          return updated;
        });

        await supabase.from("chat_history").insert([
          { user_id: user!.id, role: "user", message: userMsg.content, sentiment, conversation_id: activeId },
          { user_id: user!.id, role: "assistant", message: result.success ? result.summary! : `Lỗi: ${result.error}`, sentiment: "neutral", conversation_id: activeId },
        ]);

        if (messages.length === 0 && activeConversation?.title === "New Chat") {
          renameConversation(activeId, "Xem tiến độ học tập");
        }

        setIsLoading(false);
        return;
      }

      // Check for delete roadmap intent
      const deleteAction = parseDeleteRoadmapIntent(text);
      if (deleteAction) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⏳ Đang xóa roadmap **${deleteAction.skill}** và dữ liệu liên quan...` }]);

        const result = await executeDeleteRoadmapAction(deleteAction, user!.id);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: result.success
              ? `✅ Đã xóa roadmap **${result.skill}** thành công!\n\n- 🗑️ Đã xóa goal, roadmap và lịch học liên quan.\n\n👉 Gõ **"tạo roadmap [skill] [tuần]"** để tạo lại.`
              : `❌ ${result.error}`
          };
          return updated;
        });

        if (result.success) {
          toast.success(`Đã xóa roadmap ${result.skill}!`);
          queryClient.invalidateQueries({ queryKey: ["goals"] });
          queryClient.invalidateQueries({ queryKey: ["schedules"] });
        }

        await supabase.from("chat_history").insert([
          { user_id: user!.id, role: "user", message: userMsg.content, sentiment, conversation_id: activeId },
          { user_id: user!.id, role: "assistant", message: result.success ? `Đã xóa roadmap ${result.skill}.` : `Lỗi: ${result.error}`, sentiment: "neutral", conversation_id: activeId },
        ]);

        if (messages.length === 0 && activeConversation?.title === "New Chat") {
          renameConversation(activeId, text.slice(0, 40) + (text.length > 40 ? "..." : ""));
        }

        setIsLoading(false);
        return;
      }

      // Check for list goals intent
      const listGoalsAction = parseListGoalsIntent(text);
      if (listGoalsAction) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⏳ Đang tải danh sách goals...` }]);

        const result = await executeListGoalsAction(user!.id);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: result.success ? result.summary! : `❌ ${result.error}`
          };
          return updated;
        });

        await supabase.from("chat_history").insert([
          { user_id: user!.id, role: "user", message: userMsg.content, sentiment, conversation_id: activeId },
          { user_id: user!.id, role: "assistant", message: result.success ? result.summary! : `Lỗi: ${result.error}`, sentiment: "neutral", conversation_id: activeId },
        ]);

        if (messages.length === 0 && activeConversation?.title === "New Chat") {
          renameConversation(activeId, "Danh sách goals");
        }

        setIsLoading(false);
        return;
      }

      // Check for schedule intent
      const scheduleAction = parseScheduleIntent(text);
      if (scheduleAction) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⏳ Đang tạo lịch học từ roadmap **${scheduleAction.skill}**...` }]);

        const result = await executeScheduleAction(scheduleAction, user!.id);

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: result.success
              ? `✅ Đã tạo lịch học **${scheduleAction.skill}** thành công!\n\n- 📋 Tổng số task: **${result.taskCount}**\n- 📅 Lịch được phân bổ theo milestones\n\n👉 Vào trang **Schedule** để xem và quản lý lịch học.`
              : `❌ ${result.error}`
          };
          return updated;
        });

        if (result.success) {
          toast.success(`Đã tạo ${result.taskCount} task cho lịch học ${scheduleAction.skill}!`);
          queryClient.invalidateQueries({ queryKey: ["schedules"] });
        }

        await supabase.from("chat_history").insert([
          { user_id: user!.id, role: "user", message: userMsg.content, sentiment, conversation_id: activeId },
          { user_id: user!.id, role: "assistant", message: result.success ? `Đã tạo lịch học ${scheduleAction.skill} với ${result.taskCount} tasks.` : `Lỗi: ${result.error}`, sentiment: "neutral", conversation_id: activeId },
        ]);

        if (messages.length === 0 && activeConversation?.title === "New Chat") {
          renameConversation(activeId, text.slice(0, 40) + (text.length > 40 ? "..." : ""));
        }

        setIsLoading(false);
        return;
      }
    }

    await supabase.from("chat_history").insert({
      user_id: user!.id,
      role: "user",
      message: userMsg.content,
      sentiment,
      conversation_id: activeId,
    });

    // Build system prompt based on conversation type
    const isMaster = isMasterChannel;
    let systemContext = isMaster
      ? "You are the Master Control AI for NeuroPlan. You can help create roadmaps, manage schedules, control prompts, and give strategic guidance. Respond in the user's language."
      : activeConversation?.skill
      ? `You are an AI tutor specializing in "${activeConversation.skill}". Focus your responses on this skill area. Respond in the user's language.`
      : "You are NeuroPlan AI Mentor. Help with studying and learning. Respond in the user's language.";

    // Auto-inject relevant vault prompts
    try {
      const vaultPrompts = await findRelevantPrompts(user!.id, text, activeConversation?.skill);
      if (vaultPrompts.length > 0) {
        systemContext = buildEnhancedSystemPrompt(systemContext, vaultPrompts);
      }
    } catch { /* vault injection is best-effort */ }

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        sentiment,
        token: session.access_token,
        systemPrompt: systemContext,
        onDelta: upsertAssistant,
        onDone: async () => {
          setIsLoading(false);
          if (assistantSoFar) {
            await supabase.from("chat_history").insert({
              user_id: user!.id,
              role: "assistant",
              message: assistantSoFar,
              sentiment: "neutral",
              conversation_id: activeId,
            });
          }
          // Auto-rename if first message
          if (messages.length === 0 && activeConversation?.title === "New Chat") {
            const shortTitle = text.slice(0, 40) + (text.length > 40 ? "..." : "");
            renameConversation(activeId, shortTitle);
          }
        },
        onError: (err) => {
          toast.error(err);
          setIsLoading(false);
        },
      });
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user || !activeId) return;
    await supabase.from("chat_history").delete().eq("user_id", user.id).eq("conversation_id", activeId);
    setMessages([]);
    toast.success("Đã xóa lịch sử chat");
  };

  const handleCreateConversation = (title: string, skill?: string) => {
    createConversation(title, skill);
    if (isMobile) setMobileSidebar(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveId(id);
    if (isMobile) setMobileSidebar(false);
  };

  const isMaster = activeConversation?.conversation_type === "master";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="gradient-mesh fixed inset-0 pointer-events-none" />
      <Navbar />
      <main className="flex-1 flex pt-16 relative z-10">
        {/* Sidebar - desktop always, mobile overlay */}
        <div className={`${isMobile ? "absolute inset-y-0 left-0 z-30 pt-16" : ""} ${isMobile && !mobileSidebar ? "hidden" : ""}`}>
          <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
            onCreate={handleCreateConversation}
            onDelete={deleteConversation}
            onRename={renameConversation}
          />
        </div>
        {/* Mobile overlay backdrop */}
        {isMobile && mobileSidebar && (
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-20 pt-16" onClick={() => setMobileSidebar(false)} />
        )}

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            conversation={activeConversation}
            onClear={clearChat}
            onToggleSidebar={() => setMobileSidebar(!mobileSidebar)}
            showMenuButton={isMobile}
          />
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            loadingHistory={loadingHistory || convosLoading}
            isMaster={isMaster}
          />
          <ChatInput
            onSend={handleSend}
            disabled={isLoading || !activeId}
            placeholder={isMaster ? "Ra lệnh cho AI... (roadmap, schedule, prompts)" : undefined}
          />
        </div>
      </main>
    </div>
  );
}
