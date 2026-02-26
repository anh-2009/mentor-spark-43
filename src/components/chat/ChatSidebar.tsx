import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, MessageSquare, Crown, ChevronLeft, ChevronRight, Pencil, Check, X,
} from "lucide-react";
import type { Conversation } from "@/hooks/useConversations";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string, skill?: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export default function ChatSidebar({ conversations, activeId, onSelect, onCreate, onDelete, onRename }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const masterConvos = conversations.filter((c) => c.conversation_type === "master");
  const skillConvos = conversations.filter((c) => c.conversation_type === "skill");

  const startEdit = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div
      className={`relative flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 ${
        collapsed ? "w-14" : "w-72"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-foreground" /> : <ChevronLeft className="w-3 h-3 text-foreground" />}
      </button>

      {/* New Chat */}
      <div className="p-2">
        <button
          onClick={() => onCreate("New Chat")}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 space-y-1">
        {/* Master */}
        {masterConvos.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all group ${
              activeId === c.id
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Crown className="w-4 h-4 flex-shrink-0 text-secondary" />
            {!collapsed && (
              <span className="truncate font-semibold text-left flex-1">{c.title}</span>
            )}
          </button>
        ))}

        {!collapsed && skillConvos.length > 0 && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
            Conversations
          </div>
        )}

        <AnimatePresence>
          {skillConvos.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div
                onClick={() => onSelect(c.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all group ${
                  activeId === c.id
                    ? "bg-primary/10 text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    {editingId === c.id ? (
                      <div className="flex-1 flex items-center gap-1">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button onClick={(e) => { e.stopPropagation(); saveEdit(); }} className="text-primary">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="text-muted-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-left truncate">
                          <span className="truncate">{c.title}</span>
                          {c.skill && (
                            <span className="ml-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                              {c.skill}
                            </span>
                          )}
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); startEdit(c); }}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
