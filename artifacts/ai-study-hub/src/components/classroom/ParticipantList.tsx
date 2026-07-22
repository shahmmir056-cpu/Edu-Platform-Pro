import { X, Mic, MicOff, Video, VideoOff, Hand, Pin, UserMinus, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Participant } from "@/lib/classroom-types";

interface ParticipantListProps {
  participants: Participant[];
  isTeacher: boolean;
  onSpotlight: (socketId: string) => void;
  onRemove: (socketId: string) => void;
  onClose: () => void;
}

export function ParticipantList({ participants, isTeacher, onSpotlight, onRemove, onClose }: ParticipantListProps) {
  const teachers = participants.filter((p) => p.role === "teacher");
  const students = participants.filter((p) => p.role === "student");

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-80">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="font-serif font-bold text-white text-sm">Participants ({participants.length})</h3>
        <button onClick={onClose} className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {teachers.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 px-1">Teachers</p>
            {teachers.map((p) => (
              <ParticipantRow key={p.socketId} participant={p} isTeacher={isTeacher} onSpotlight={onSpotlight} onRemove={onRemove} />
            ))}
          </div>
        )}
        {students.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2 px-1">Students ({students.length})</p>
            {students.map((p) => (
              <ParticipantRow key={p.socketId} participant={p} isTeacher={isTeacher} onSpotlight={onSpotlight} onRemove={onRemove} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParticipantRow({ participant: p, isTeacher, onSpotlight, onRemove }: {
  participant: Participant;
  isTeacher: boolean;
  onSpotlight: (socketId: string) => void;
  onRemove: (socketId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors group">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
        {p.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate flex items-center gap-1.5">
          {p.name}
          {p.role === "teacher" && <Crown size={10} className="text-amber-400 shrink-0" />}
          {p.isSpotlighted && <Pin size={10} className="text-primary shrink-0" />}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {p.isHandRaised && <Hand size={12} className="text-amber-400" />}
        {p.isMuted ? <MicOff size={12} className="text-red-400" /> : <Mic size={12} className="text-emerald-400" />}
        {p.isCameraOff ? <VideoOff size={12} className="text-red-400" /> : <Video size={12} className="text-emerald-400" />}
        {isTeacher && p.role !== "teacher" && (
          <>
            <button onClick={() => onSpotlight(p.socketId)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 hover:text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Pin size={10} />
            </button>
            <button onClick={() => onRemove(p.socketId)} className="w-6 h-6 rounded bg-zinc-800 text-zinc-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <UserMinus size={10} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
