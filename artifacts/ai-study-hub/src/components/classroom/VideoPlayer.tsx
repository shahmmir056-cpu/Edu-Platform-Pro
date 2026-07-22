import { useEffect, useRef } from "react";
import { Mic, MicOff, VideoIcon, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  stream?: MediaStream;
  name: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreenSharing?: boolean;
  isSpotlighted?: boolean;
  isSelf?: boolean;
  role?: "teacher" | "student";
  handRaised?: boolean;
  className?: string;
}

export function VideoPlayer({
  stream,
  name,
  isMuted = false,
  isCameraOff = false,
  isSpotlighted = false,
  isSelf = false,
  role,
  handRaised = false,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden bg-zinc-900 border-2 transition-all",
        isSpotlighted ? "border-primary ring-2 ring-primary/30" : "border-zinc-800",
        className
      )}
    >
      {!isCameraOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isSelf}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-2xl md:text-3xl font-serif font-bold text-primary">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-medium text-white">
          {role === "teacher" && (
            <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded uppercase">
              Host
            </span>
          )}
          <span className="truncate max-w-[120px]">{isSelf ? `${name} (You)` : name}</span>
        </div>
        <div className="flex items-center gap-1">
          {handRaised && (
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] animate-bounce">
              ✋
            </div>
          )}
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            isMuted ? "bg-red-500/80" : "bg-emerald-500/80"
          )}>
            {isMuted ? <MicOff size={12} className="text-white" /> : <Mic size={12} className="text-white" />}
          </div>
        </div>
      </div>
    </div>
  );
}
