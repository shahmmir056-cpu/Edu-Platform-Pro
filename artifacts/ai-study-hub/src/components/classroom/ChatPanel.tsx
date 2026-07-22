import { useState, useRef, useEffect } from "react";
import { Send, X, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/classroom-types";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSend: (content: string, isPrivate?: boolean, recipientId?: string) => void;
  onClose: () => void;
}

export function ChatPanel({ messages, currentUserId, onSend, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [recipientId, setRecipientId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim(), isPrivate, recipientId);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="font-serif font-bold text-white text-sm">Chat</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-zinc-600 text-sm mt-10">No messages yet</p>
        )}
        {messages.map((msg) => {
          const isSelf = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={cn("flex flex-col", isSelf ? "items-end" : "items-start")}>
              <span className="text-[10px] text-zinc-500 mb-0.5 px-1">
                {msg.senderName} {msg.isPrivate && <Lock size={8} className="inline" />}
              </span>
              <div className={cn(
                "px-3 py-2 rounded-xl text-sm max-w-[90%] break-words",
                isSelf ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-200"
              )}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={() => { setIsPrivate(false); setRecipientId(undefined); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors",
              !isPrivate ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-500"
            )}
          >
            <Globe size={10} /> Public
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors",
              isPrivate ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-500"
            )}
          >
            <Lock size={10} /> Private
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isPrivate ? "Private message..." : "Type a message..."}
            className="flex-1 bg-zinc-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
