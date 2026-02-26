import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border/50">
      <div className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Nhắn tin cho AI... / Type a message..."}
          rows={1}
          className="flex-1 resize-none bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 scrollbar-thin"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all neon-glow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
