import { X, UserCheck, UserX } from "lucide-react";
import type { WaitingUser } from "@/lib/classroom-types";

interface WaitingRoomProps {
  waiting: WaitingUser[];
  onApprove: (socketId: string) => void;
  onDeny: (socketId: string) => void;
  onClose: () => void;
}

export function WaitingRoom({ waiting, onApprove, onDeny, onClose }: WaitingRoomProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-serif font-bold text-white">Waiting Room ({waiting.length})</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
          {waiting.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-6">No one waiting</p>
          )}
          {waiting.map((w) => (
            <div key={w.socketId} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{w.name}</p>
                <p className="text-[10px] text-zinc-500 capitalize">{w.role}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onApprove(w.socketId)} className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center">
                  <UserCheck size={14} />
                </button>
                <button onClick={() => onDeny(w.socketId)} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center">
                  <UserX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
