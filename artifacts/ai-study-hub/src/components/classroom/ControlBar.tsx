import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand,
  PhoneOff, MessageSquare, Users, PenTool, MoreVertical,
  Circle, StopCircle, FileUp, BarChart3, LayoutGrid,
  Lock, Unlock, UserMinus, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isTeacher: boolean;
  isRecording: boolean;
  participantCount: number;
  unreadChat: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleRecording: () => void;
  onEndClass: () => void;
  onOpenChat: () => void;
  onOpenParticipants: () => void;
  onOpenWhiteboard: () => void;
  onOpenFiles: () => void;
  onOpenPoll: () => void;
  onOpenBreakouts: () => void;
  onMuteAll: () => void;
  onToggleLock: () => void;
  isLocked: boolean;
}

export function ControlBar({
  isMuted, isCameraOff, isScreenSharing, isHandRaised,
  isTeacher, isRecording, participantCount, unreadChat,
  onToggleMute, onToggleCamera, onToggleScreenShare,
  onToggleHandRaise, onToggleRecording, onEndClass,
  onOpenChat, onOpenParticipants, onOpenWhiteboard,
  onOpenFiles, onOpenPoll, onOpenBreakouts,
  onMuteAll, onToggleLock, isLocked,
}: ControlBarProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="relative bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex items-center justify-between gap-2">
      {/* Left: Media controls */}
      <div className="flex items-center gap-1.5">
        <ControlButton
          active={!isMuted}
          danger={isMuted}
          onClick={onToggleMute}
          tooltip={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </ControlButton>
        <ControlButton
          active={!isCameraOff}
          danger={isCameraOff}
          onClick={onToggleCamera}
          tooltip={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
        </ControlButton>
        <ControlButton
          active={isScreenSharing}
          onClick={onToggleScreenShare}
          tooltip="Share Screen"
        >
          <MonitorUp size={18} />
        </ControlButton>
        {!isTeacher && (
          <ControlButton
            active={isHandRaised}
            onClick={onToggleHandRaise}
            tooltip="Raise Hand"
            accent={isHandRaised}
          >
            <Hand size={18} />
          </ControlButton>
        )}
      </div>

      {/* Center: Feature buttons */}
      <div className="hidden md:flex items-center gap-1">
        <SmallButton onClick={onOpenWhiteboard} icon={PenTool} label="Whiteboard" />
        <SmallButton onClick={onOpenChat} icon={MessageSquare} label="Chat" badge={unreadChat || undefined} />
        <SmallButton onClick={onOpenParticipants} icon={Users} label={`${participantCount}`} />
        <SmallButton onClick={onOpenFiles} icon={FileUp} label="Files" />
        {isTeacher && (
          <>
            <SmallButton onClick={onOpenPoll} icon={BarChart3} label="Poll" />
            <SmallButton onClick={onOpenBreakouts} icon={LayoutGrid} label="Rooms" />
          </>
        )}
      </div>

      {/* Right: Record + End */}
      <div className="flex items-center gap-1.5">
        {isTeacher && (
          <>
            <ControlButton
              active={isRecording}
              danger={isRecording}
              onClick={onToggleRecording}
              tooltip={isRecording ? "Stop Recording" : "Record"}
              pulse={isRecording}
            >
              {isRecording ? <StopCircle size={18} /> : <Circle size={18} />}
            </ControlButton>
            <ControlButton
              active={isLocked}
              onClick={onToggleLock}
              tooltip={isLocked ? "Unlock Room" : "Lock Room"}
            >
              {isLocked ? <Lock size={18} /> : <Unlock size={18} />}
            </ControlButton>
            <ControlButton onClick={onMuteAll} tooltip="Mute All">
              <MicOff size={18} />
            </ControlButton>
          </>
        )}
        <button
          onClick={onEndClass}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
        >
          <PhoneOff size={16} />
          <span className="hidden sm:inline">End</span>
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  children, active, danger, onClick, tooltip, accent, pulse,
}: {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  tooltip?: string;
  accent?: boolean;
  pulse?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        "relative w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all",
        danger
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : active
          ? "bg-primary/20 text-primary hover:bg-primary/30"
          : accent
          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      )}
    >
      {children}
      {pulse && (
        <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/20" />
      )}
    </button>
  );
}

function SmallButton({
  onClick, icon: Icon, label, badge,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white text-xs font-medium transition-colors"
    >
      <Icon size={14} />
      <span className="hidden lg:inline">{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
