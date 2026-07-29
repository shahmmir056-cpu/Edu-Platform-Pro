import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Square } from "lucide-react";
import type { ChatMessage } from "../types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isAiTyping: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onSend: (text: string) => void;
  onToggleMic: () => void;
  onStopSpeaking: () => void;
  transcript: string;
  placeholder?: string;
  accentColor?: string;
  disabled?: boolean;
}

export function ChatInterface({
  messages,
  isAiTyping,
  isListening,
  isSpeaking,
  onSend,
  onToggleMic,
  onStopSpeaking,
  transcript,
  placeholder = "Type your response...",
  accentColor = "#E8852E",
  disabled = false,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isAiTyping]);

  const handleSend = () => {
    const text = (input || transcript).trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,159,76,0.12) transparent" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,159,76,0.08)", border: "2px solid #2D2D2D" }}
            >
              <span className="text-2xl">🤖</span>
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                {disabled ? "Select a topic to begin" : "Conversation is live"}
              </p>
              <p className="text-xs max-w-[260px] leading-relaxed" style={{ color: "#9A9A9A" }}>
                {disabled
                  ? "Enter a topic in the sidebar and click Start Session"
                  : "Microphone is on — just speak naturally. The AI will respond and listen for your reply."}
              </p>
            </div>
            {!disabled && isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "rgba(255,159,76,0.08)", border: "1.5px solid rgba(255,159,76,0.2)" }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4CAF50" }} />
                <span className="text-xs font-medium" style={{ color: "#E8852E" }}>Listening now...</span>
              </motion.div>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] sm:max-w-[82%] ${msg.role === "user" ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5 px-1">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,159,76,0.12)", border: "1.5px solid #2D2D2D" }}>
                      <span className="text-[9px]">🤖</span>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: "#9A9A9A" }}>Neural Sync AI</span>
                  </div>
                )}
                <div
                  className="lg-card px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #FF9F4C, #E8852E)"
                      : undefined,
                    border: msg.role === "user" ? "none" : undefined,
                    color: msg.role === "user" ? "#fff" : "#2D2D2D",
                    boxShadow: msg.role === "user"
                      ? "0 4px 16px rgba(255,159,76,0.30), inset 0 1px 0 rgba(255,255,255,0.15)"
                      : undefined,
                  }}
                >
                  <p className="break-words" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isAiTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 px-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,159,76,0.12)", border: "1.5px solid #2D2D2D" }}>
                  <span className="text-[9px]">🤖</span>
                </div>
                <span className="text-[10px] font-semibold" style={{ color: "#9A9A9A" }}>Thinking...</span>
              </div>
              <div className="lg-card px-4 py-3 inline-flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#E8852E" }}
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Live transcript */}
        {isListening && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <div
              className="max-w-[92%] sm:max-w-[70%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm italic"
              style={{ background: "rgba(255,159,76,0.08)", color: "rgba(232,133,46,0.7)", border: "1.5px dashed rgba(255,159,76,0.28)" }}
            >
              {transcript}...
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div className="px-5 pb-5 pt-3">
        <div
          className="lg-strong flex items-center gap-3 px-4 py-2.5 flex-wrap"
          style={{ borderRadius: "1.25rem" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={disabled ? "Start a session first..." : isListening ? "Listening..." : placeholder}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[#9A9A9A]"
            style={{ color: "#2D2D2D", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            disabled={isListening || disabled}
          />

          {/* Voice button */}
          <button
            onClick={onToggleMic}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{
              background: isListening ? "linear-gradient(135deg, #FF9F4C, #E8852E)" : "rgba(255,159,76,0.10)",
              color: isListening ? "#fff" : "#E8852E",
              border: "1.5px solid #2D2D2D",
            }}
          >
            {isListening ? <Mic size={16} /> : <MicOff size={16} />}
          </button>

          {/* Stop speaking */}
          {isSpeaking && (
            <button
              onClick={onStopSpeaking}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(229,57,53,0.08)", color: "#E53935", border: "1.5px solid #D44" }}
            >
              <Square size={14} />
            </button>
          )}

          {/* Send */}
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 lg-button"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
