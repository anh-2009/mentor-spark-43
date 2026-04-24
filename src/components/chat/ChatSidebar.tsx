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
    <nav
      aria-label="Conversations"
      className={`relative flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 ${
        collapsed ? "w-14" : "w-72"
      }`}
    >
      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-foreground" aria-hidden="true" /> : <ChevronLeft className="w-3 h-3 text-foreground" aria-hidden="true" />}
      </button>

      {/* New Chat */}
      <div className="p-2">
        <button
          onClick={() => onCreate("New Chat")}
          type="button"
          aria-label="Start a new chat"
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Plus className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 space-y-1">
        {/* Master section */}
        {masterConvos.length > 0 && (
          <ul role="list" aria-label="Master channels" className="space-y-1">
            {masterConvos.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => onSelect(c.id)}
                  type="button"
                  aria-current={activeId === c.id ? "true" : undefined}
                  aria-label={`Open ${c.title}`}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    activeId === c.id
                      ? "bg-primary/15 text-primary border border-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Crown className="w-4 h-4 flex-shrink-0 text-secondary" aria-hidden="true" />
                  {!collapsed && (
                    <span className="truncate font-semibold text-left flex-1">{c.title}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!collapsed && skillConvos.length > 0 && (
          <div
            id="skill-conversations-heading"
            className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1"
          >
            Conversations
          </div>
        )}

        <ul
          role="list"
          aria-labelledby={!collapsed && skillConvos.length > 0 ? "skill-conversations-heading" : undefined}
          aria-label={collapsed ? "Skill conversations" : undefined}
          className="space-y-1"
        >
          <AnimatePresence>
            {skillConvos.map((c) => {
              const isEditing = editingId === c.id;
              const isActive = activeId === c.id;
              return (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <div
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all group ${
                      isActive
                        ? "bg-primary/10 text-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    {isEditing ? (
                      <>
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 flex items-center gap-1">
                          <label htmlFor={`rename-${c.id}`} className="sr-only">
                            Rename conversation
                          </label>
                          <input
                            id={`rename-${c.id}`}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEdit();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingId(null);
                              }
                            }}
                            className="flex-1 bg-transparent border-b border-primary text-sm outline-none focus-visible:ring-0"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveEdit}
                            aria-label="Save new title"
                            title="Save (Enter)"
                            className="text-primary p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          >
                            <Check className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="Cancel rename"
                            title="Cancel (Esc)"
                            className="text-muted-foreground p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelect(c.id)}
                          aria-current={isActive ? "true" : undefined}
                          aria-label={`Open conversation ${c.title}${c.skill ? `, skill ${c.skill}` : ""}`}
                          className={`flex-1 flex items-center gap-2 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${collapsed ? "justify-center" : ""}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                          {!collapsed && (
                            <span className="truncate flex-1">
                              <span className="truncate">{c.title}</span>
                              {c.skill && (
                                <span className="ml-1 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                                  {c.skill}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                        {!collapsed && (
                          <div className="hidden group-hover:flex group-focus-within:flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => startEdit(c)}
                              aria-label={`Rename conversation ${c.title}`}
                              title="Rename"
                              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                              <Pencil className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(c.id)}
                              aria-label={`Delete conversation ${c.title}`}
                              title="Delete"
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                            >
                              <Trash2 className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </nav>
  );
}
