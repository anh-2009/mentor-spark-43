import { Crown, Bot, Trash2, Menu } from "lucide-react";
import type { Conversation } from "@/hooks/useConversations";

interface Props {
  conversation: Conversation | null;
  onClear: () => void;
  onToggleSidebar?: () => void;
  showMenuButton?: boolean;
}

export default function ChatHeader({ conversation, onClear, onToggleSidebar, showMenuButton }: Props) {
  const isMaster = conversation?.conversation_type === "master";

  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
      <div className="flex items-center gap-2">
        {showMenuButton && (
          <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground mr-1 md:hidden">
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMaster ? "bg-secondary/10" : "bg-primary/10"}`}>
          {isMaster ? <Crown className="w-4 h-4 text-secondary" /> : <Bot className="w-4 h-4 text-primary" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {conversation?.title || "NeuroPlan AI"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isMaster ? "Kênh điều khiển chính" : conversation?.skill ? `Skill: ${conversation.skill}` : "Sẵn sàng hỗ trợ bạn"}
          </p>
        </div>
      </div>
      <button
        onClick={onClear}
        className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
