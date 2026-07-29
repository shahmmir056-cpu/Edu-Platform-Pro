import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorPlay,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  Hand,
  MessageCircle,
  Users,
  Send,
  Smile,
  ChevronLeft,
  ChevronRight,
  Camera,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { ToolHeader } from "@/components/ui/ToolHeader";

type Participant = {
  id: number;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
};

type ChatMessage = {
  id: number;
  sender: string;
  text: string;
  time: string;
};

const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 1, name: "You", avatar: "🧑‍🎓", isSpeaking: false, isMuted: false, isVideoOn: true, isHandRaised: false },
  { id: 2, name: "Dr. Sarah", avatar: "👩‍🏫", isSpeaking: true, isMuted: false, isVideoOn: true, isHandRaised: false },
  { id: 3, name: "Alex", avatar: "👨‍💻", isSpeaking: false, isMuted: true, isVideoOn: true, isHandRaised: false },
  { id: 4, name: "Emma", avatar: "👩‍🔬", isSpeaking: false, isMuted: false, isVideoOn: false, isHandRaised: true },
  { id: 5, name: "James", avatar: "🧑‍🚀", isSpeaking: false, isMuted: true, isVideoOn: true, isHandRaised: false },
  { id: 6, name: "Mia", avatar: "👩‍🎨", isSpeaking: false, isMuted: true, isVideoOn: true, isHandRaised: false },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: 1, sender: "Dr. Sarah", text: "Welcome everyone to today's session on Quantum Computing!", time: "10:02 AM" },
  { id: 2, sender: "Alex", text: "Excited to be here! 🔬", time: "10:03 AM" },
  { id: 3, sender: "Emma", text: "I have a question about superposition", time: "10:05 AM" },
];

export default function VirtualClassroom() {
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [isLectureActive] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const toggleMute = () => setIsMuted(p => !p);
  const toggleVideo = () => setIsVideoOn(p => !p);
  const toggleScreenShare = () => setIsScreenSharing(p => !p);
  const toggleHandRaise = () => {
    setIsHandRaised(p => !p);
    setParticipants(prev => prev.map(p =>
      p.id === 1 ? { ...p, isHandRaised: !p.isHandRaised } : p
    ));
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: "You",
      text: chatInput.trim(),
      time: timeStr,
    }]);
    setChatInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12">
      <ToolHeader
        title="Virtual Classroom"
        description="Real-time collaborative learning environment"
        icon={MonitorPlay}
      />

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <button
          onClick={toggleMute}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: isMuted ? "rgba(239,68,68,0.1)" : "rgba(255,159,76,0.1)",
            color: isMuted ? "#EF4444" : "#FF9F4C",
            border: `1px solid ${isMuted ? "rgba(239,68,68,0.2)" : "rgba(255,159,76,0.2)"}`,
          }}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={toggleVideo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: !isVideoOn ? "rgba(239,68,68,0.1)" : "rgba(255,159,76,0.1)",
            color: !isVideoOn ? "#EF4444" : "#FF9F4C",
            border: `1px solid ${!isVideoOn ? "rgba(239,68,68,0.2)" : "rgba(255,159,76,0.2)"}`,
          }}
        >
          {!isVideoOn ? <VideoOff size={16} /> : <Video size={16} />}
          {!isVideoOn ? "Start Video" : "Stop Video"}
        </button>
        <button
          onClick={toggleScreenShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: isScreenSharing ? "rgba(255,159,76,0.15)" : "rgba(255,159,76,0.1)",
            color: "#FF9F4C",
            border: `1px solid ${isScreenSharing ? "rgba(255,159,76,0.3)" : "rgba(255,159,76,0.2)"}`,
          }}
        >
          <ScreenShare size={16} />
          {isScreenSharing ? "Stop Share" : "Share Screen"}
        </button>
        <button
          onClick={toggleHandRaise}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: isHandRaised ? "rgba(59,130,246,0.15)" : "rgba(255,159,76,0.1)",
            color: isHandRaised ? "#3B82F6" : "#FF9F4C",
            border: `1px solid ${isHandRaised ? "rgba(59,130,246,0.3)" : "rgba(255,159,76,0.2)"}`,
          }}
        >
          <Hand size={16} />
          {isHandRaised ? "Lower Hand" : "Raise Hand"}
        </button>
        <button
          onClick={() => setShowChat(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all lg:hidden"
          style={{
            background: showChat ? "rgba(255,159,76,0.15)" : "rgba(255,159,76,0.1)",
            color: "#FF9F4C",
            border: "1px solid rgba(255,159,76,0.2)",
          }}
        >
          <MessageCircle size={16} />
          Chat
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-4">
        {/* Main video area + grid */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Lecture / Main screen */}
          <motion.div
            layout
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,159,76,0.08), rgba(255,212,168,0.05))",
              border: "1px solid rgba(255,159,76,0.15)",
              aspectRatio: "16/9",
            }}
          >
            {isLectureActive ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: "linear-gradient(135deg, #FF9F4C, #FFD4A8)",
                      boxShadow: "0 4px 24px rgba(255,159,76,0.3)",
                    }}
                  >
                    <Camera size={36} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: "#FF9F4C" }}>Dr. Sarah's Lecture</h3>
                  <p style={{ color: "#6B6B6B" }} className="text-sm">Introduction to Quantum Computing</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "#4ADE80" }}>
                      <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                      Live
                    </span>
                    <span className="text-xs" style={{ color: "#9A9A9A" }}>42 watching</span>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Volume2 size={16} style={{ color: "#6B6B6B" }} />
                    <div className="w-48 h-1.5 rounded-full" style={{ background: "rgba(255,159,76,0.15)" }}>
                      <div className="h-full w-3/4 rounded-full" style={{ background: "#FF9F4C" }} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p style={{ color: "#6B6B6B" }}>Lecture ended</p>
              </div>
            )}

            {/* Speaker indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
            >
              <span className="text-sm">👩‍🏫</span>
              <span className="text-xs text-white font-medium">Dr. Sarah (Instructor)</span>
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
            </div>
          </motion.div>

          {/* Participant grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.filter(p => p.id !== 2).map((p) => (
              <motion.div
                key={p.id}
                layout
                className="relative rounded-xl overflow-hidden"
                style={{
                  aspectRatio: "4/3",
                  background: "rgba(255,159,76,0.04)",
                  border: `1px solid ${p.isSpeaking ? "rgba(74,222,128,0.4)" : "rgba(255,159,76,0.1)"}`,
                  boxShadow: p.isSpeaking ? "0 0 16px rgba(74,222,128,0.15)" : "none",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl">{p.avatar}</span>
                    <p className="text-[11px] font-medium mt-1" style={{ color: "#6B6B6B" }}>{p.name}</p>
                  </div>
                </div>

                {/* Status badges */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {p.isHandRaised && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: "rgba(59,130,246,0.3)" }}
                    >
                      ✋
                    </span>
                  )}
                  {p.isMuted && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.3)" }}
                    >
                      <MicOff size={10} style={{ color: "#EF4444" }} />
                    </span>
                  )}
                </div>

                {/* Speaking indicator */}
                {p.isSpeaking && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#4ADE80" }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Side panels - hidden on mobile by default */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block shrink-0"
            >
              <div className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,159,76,0.1)",
                  height: "100%",
                }}
              >
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(255,159,76,0.08)" }}
                >
                  <span className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Participants</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,159,76,0.1)", color: "#9A9A9A" }}>
                    {participants.length}
                  </span>
                </div>
                <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:bg-white/5">
                      <span className="text-lg">{p.avatar}</span>
                      <span className="text-sm flex-1" style={{ color: "#6B6B6B" }}>{p.name}</span>
                      {p.isSpeaking && <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />}
                      {p.isHandRaised && <span className="text-xs">✋</span>}
                      {p.isMuted && <MicOff size={12} style={{ color: "#9A9A9A" }} />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat panel */}
        <AnimatePresence>
          {(showChat || window.innerWidth >= 1024) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block shrink-0"
            >
              <div className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,159,76,0.1)",
                  height: "100%",
                  maxHeight: "600px",
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 shrink-0"
                  style={{ borderBottom: "1px solid rgba(255,159,76,0.08)" }}
                >
                  <span className="text-sm font-bold" style={{ color: "#FF9F4C" }}>Chat</span>
                  <div className="flex gap-1">
                    <button onClick={() => setShowParticipants(p => !p)} className="p-1 rounded hover:bg-white/5">
                      <Users size={14} style={{ color: "#9A9A9A" }} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map(msg => (
                    <div key={msg.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold" style={{ color: msg.sender === "You" ? "#FF9F4C" : "#E8852E" }}>
                          {msg.sender}
                        </span>
                        <span className="text-[10px]" style={{ color: "#9A9A9A" }}>{msg.time}</span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "#4B5563" }}>{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,159,76,0.08)" }}>
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        background: "rgba(255,159,76,0.05)",
                        border: "1px solid rgba(255,159,76,0.15)",
                        color: "#2D2D2D",
                      }}
                    />
                    <button
                      onClick={sendChat}
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #FF9F4C, #E8852E)",
                        color: "#ffffff",
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile chat overlay */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setShowChat(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative ml-auto w-[85vw] max-w-sm h-full rounded-l-2xl p-4 flex flex-col"
            style={{ background: "#ffffff" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold" style={{ color: "#FF9F4C" }}>Chat</span>
              <button onClick={() => setShowChat(false)} className="p-1 rounded hover:bg-gray-100">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.map(msg => (
                <div key={msg.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold" style={{ color: msg.sender === "You" ? "#FF9F4C" : "#E8852E" }}>
                      {msg.sender}
                    </span>
                    <span className="text-[10px]" style={{ color: "#9A9A9A" }}>{msg.time}</span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: "#4B5563" }}>{msg.text}</p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,159,76,0.05)",
                  border: "1px solid rgba(255,159,76,0.15)",
                  color: "#2D2D2D",
                }}
              />
              <button
                onClick={sendChat}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #FF9F4C, #E8852E)",
                  color: "#ffffff",
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
