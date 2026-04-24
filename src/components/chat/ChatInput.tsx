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
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex gap-2 items-end"
        aria-label="Send a message"
      >
        <label htmlFor="chat-message-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-message-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Nhắn tin cho AI... / Type a message..."}
          rows={1}
          aria-label="Message"
          aria-multiline="true"
          aria-keyshortcuts="Enter"
          aria-describedby="chat-input-hint"
          disabled={disabled}
          className="flex-1 resize-none bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-primary/50 focus-visible:ring-4 focus-visible:ring-primary/10 scrollbar-thin disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
        <span id="chat-input-hint" className="sr-only">
          Press Enter to send, Shift + Enter for a new line
        </span>
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          aria-label="Send message"
          title="Send (Enter)"
          className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-all neon-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
