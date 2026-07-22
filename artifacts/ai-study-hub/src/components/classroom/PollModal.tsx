import { useState } from "react";
import { X, Plus, BarChart3, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Poll } from "@/lib/classroom-types";

interface PollModalProps {
  poll: Poll | null;
  isTeacher: boolean;
  currentUserId: string;
  onCreate: (question: string, options: string[]) => void;
  onVote: (optionIndex: number) => void;
  onClose: () => void;
}

export function PollModal({ poll, isTeacher, currentUserId, onCreate, onVote, onClose }: PollModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [showCreate, setShowCreate] = useState(!poll);

  const handleCreate = () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) return;
    onCreate(question, options.filter((o) => o.trim()));
    setShowCreate(false);
  };

  const hasVoted = poll?.options.some((opt) => opt.votes.includes(currentUserId));
  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.votes.length, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-serif font-bold text-white">Poll</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {showCreate && isTeacher ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Question</label>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 block">Options</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={opt}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = e.target.value;
                          setOptions(next);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500"
                      />
                      {i >= 2 && (
                        <button onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 flex items-center justify-center">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setOptions((prev) => [...prev, ""])}
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                >
                  <Plus size={12} /> Add option
                </button>
              </div>
              <button
                onClick={handleCreate}
                disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition-colors"
              >
                Launch Poll
              </button>
            </div>
          ) : poll ? (
            <div className="space-y-4">
              <p className="text-white font-medium">{poll.question}</p>
              <div className="space-y-2">
                {poll.options.map((opt, i) => {
                  const pct = totalVotes > 0 ? (opt.votes.length / totalVotes) * 100 : 0;
                  const voted = opt.votes.includes(currentUserId);
                  return (
                    <button
                      key={i}
                      onClick={() => poll.isActive && !hasVoted && onVote(i)}
                      disabled={!poll.isActive || hasVoted}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden",
                        voted ? "border-primary bg-primary/10" : "border-zinc-800 bg-zinc-800/50 hover:border-zinc-700"
                      )}
                    >
                      {poll.isActive && (
                        <div
                          className="absolute inset-0 bg-primary/10 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                      <div className="relative flex items-center justify-between">
                        <span className="text-sm text-white flex items-center gap-2">
                          {voted && <Check size={14} className="text-primary" />}
                          {opt.text}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {opt.votes.length} {poll.isActive && totalVotes > 0 ? `(${Math.round(pct)}%)` : ""}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-zinc-500">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
