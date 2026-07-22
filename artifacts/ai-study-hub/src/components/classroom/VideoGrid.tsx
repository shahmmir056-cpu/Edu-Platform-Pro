import { useMemo } from "react";
import { VideoPlayer } from "./VideoPlayer";
import type { Participant } from "@/lib/classroom-types";

interface VideoGridProps {
  participants: Participant[];
  remoteStreams: Map<string, MediaStream>;
  localStream: MediaStream | null;
  localId: string;
}

export function VideoGrid({ participants, remoteStreams, localStream, localId }: VideoGridProps) {
  const spotlighted = participants.find((p) => p.isSpotlighted);
  const gridParticipants = spotlighted
    ? participants.filter((p) => p.socketId !== spotlighted.socketId)
    : participants;

  const gridCols = useMemo(() => {
    const count = gridParticipants.length;
    if (count <= 1) return "grid-cols-1";
    if (count <= 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-3 md:grid-cols-4";
  }, [gridParticipants.length]);

  return (
    <div className="flex-1 flex flex-col gap-3 p-3 overflow-hidden">
      {/* Spotlight view */}
      {spotlighted && (
        <div className="flex-1 min-h-0">
          <VideoPlayer
            stream={
              spotlighted.socketId === localId
                ? localStream ?? undefined
                : remoteStreams.get(spotlighted.socketId)
            }
            name={spotlighted.name}
            isMuted={spotlighted.isMuted}
            isCameraOff={spotlighted.isCameraOff}
            isSpotlighted
            isSelf={spotlighted.socketId === localId}
            role={spotlighted.role}
            handRaised={spotlighted.isHandRaised}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Grid */}
      {gridParticipants.length > 0 && (
        <div className={`${spotlighted ? "h-36 md:h-44 shrink-0" : "flex-1"} grid ${gridCols} gap-2 auto-rows-fr`}>
          {gridParticipants.map((p) => (
            <VideoPlayer
              key={p.socketId}
              stream={
                p.socketId === localId
                  ? localStream ?? undefined
                  : remoteStreams.get(p.socketId)
              }
              name={p.name}
              isMuted={p.isMuted}
              isCameraOff={p.isCameraOff}
              isSelf={p.socketId === localId}
              role={p.role}
              handRaised={p.isHandRaised}
            />
          ))}
        </div>
      )}
    </div>
  );
}
