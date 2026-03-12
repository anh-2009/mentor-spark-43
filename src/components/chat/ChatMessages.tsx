import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Loader2, Crown, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Msg } from "@/lib/streamChat";

interface Props {
  messages: Msg[];
  isLoading: boolean;
  loadingHistory: boolean;
  isMaster: boolean;
}

export default function ChatMessages({ messages, isLoading, loadingHistory, isMaster }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const userScrolledUp = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    userScrolledUp.current = false;
    setShowScrollBtn(false);
  }, []);

  // Check if user is near bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 80;
    userScrolledUp.current = !isNearBottom;
    setShowScrollBtn(!isNearBottom);
  }, []);

  // Auto-scroll on new messages only if user hasn't scrolled up
  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollToBottom("smooth");
    } else {
      setShowScrollBtn(true);
    }
  }, [messages, scrollToBottom]);

  if (loadingHistory) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          {isMaster ? (
            <>
              <Crown className="w-12 h-12 text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-sm font-medium">Master Control Channel</p>
              <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
                Kênh chính điều khiển roadmap, schedule và prompt system.
              </p>
            </>
          ) : (
            <>
              <Bot className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-sm">Chào bạn! 👋 Hãy hỏi mình bất cứ điều gì.</p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto scrollbar-thin p-4 space-y-4"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-1 ${isMaster ? "bg-secondary/10" : "bg-primary/10"}`}>
                {isMaster ? <Crown className="w-3.5 h-3.5 text-secondary" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "glass rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex-shrink-0 flex items-center justify-center mt-1">
                <User className="w-3.5 h-3.5 text-secondary" />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isMaster ? "bg-secondary/10" : "bg-primary/10"}`}>
              {isMaster ? <Crown className="w-3.5 h-3.5 text-secondary" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Cuộn xuống dưới"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
