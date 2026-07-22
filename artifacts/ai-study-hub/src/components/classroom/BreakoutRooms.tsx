import { useState } from "react";
import { X, Plus, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BreakoutRoom, Participant } from "@/lib/classroom-types";

interface BreakoutRoomsProps {
  breakoutRooms: BreakoutRoom[];
  participants: Participant[];
  currentSocketId: string;
  isTeacher: boolean;
  onCreate: (name: string) => void;
  onJoin: (breakoutId: string) => void;
  onClose: () => void;
}

export function BreakoutRoomsPropsComponent({
  breakoutRooms, participants, currentSocketId, isTeacher, onCreate, onJoin, onClose,
}: BreakoutRoomsProps) {
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-serif font-bold text-white">Breakout Rooms</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
          {isTeacher && (
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Room name..."
                className="flex-1 bg-zinc-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder-zinc-500"
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {breakoutRooms.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-6">No breakout rooms yet</p>
          )}

          {breakoutRooms.map((br) => {
            const memberNames = br.participants
              .map((sid) => participants.find((p) => p.socketId === sid)?.name || "Unknown")
              .join(", ");
            return (
              <div key={br.id} className="p-4 bg-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    {br.name}
                  </h4>
                  <button
                    onClick={() => onJoin(br.id)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-colors",
                      currentSocketId && br.participants.includes(currentSocketId)
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {br.participants.includes(currentSocketId) ? "Joined" : "Join"}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">
                  {br.participants.length} participant{br.participants.length !== 1 ? "s" : ""}
                  {memberNames && `: ${memberNames}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
