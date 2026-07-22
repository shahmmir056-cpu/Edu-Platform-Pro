import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { VideoGrid } from "@/components/classroom/VideoGrid";
import { ControlBar } from "@/components/classroom/ControlBar";
import { ChatPanel } from "@/components/classroom/ChatPanel";
import { ParticipantList } from "@/components/classroom/ParticipantList";
import { Whiteboard } from "@/components/classroom/Whiteboard";
import { PollModal } from "@/components/classroom/PollModal";
import { FileShare } from "@/components/classroom/FileShare";
import { BreakoutRoomsPropsComponent } from "@/components/classroom/BreakoutRooms";
import { WaitingRoom } from "@/components/classroom/WaitingRoom";
import { getSocket, disconnectSocket } from "@/lib/socket-client";
import { useWebRTC } from "@/lib/useWebRTC";
import type { Participant, ChatMessage, Poll, SharedFile, BreakoutRoom, WaitingUser, RoomState } from "@/lib/classroom-types";
import { GraduationCap, Video, VideoOff, Mic, MicOff, Settings, Phone, MonitorUp, MonitorOff, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VirtualClassroom() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const roomId = params.id;

  const searchParams = new URLSearchParams(window.location.search);
  const userName = searchParams.get("name") || "Anonymous";
  const userRole = (searchParams.get("role") as "teacher" | "student") || "student";

  // Pre-join state
  const [stage, setStage] = useState<"permissions" | "connecting" | "connected">("permissions");
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [prefCameraOn, setPrefCameraOn] = useState(true);
  const [prefMicOn, setPrefMicOn] = useState(true);
  const [permError, setPermError] = useState<string | null>(null);
  const [permDenied, setPermDenied] = useState<"camera" | "mic" | "both" | null>(null);

  // Room state
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingUser[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [hasWaitingRoom, setHasWaitingRoom] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  // Media state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Panels
  const [activePanel, setActivePanel] = useState<"chat" | "participants" | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showBreakouts, setShowBreakouts] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);

  // Refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const {
    connectToPeer, replaceTrack, cleanup,
    setOnRemoteStream, setOnRemoteStreamLost,
  } = useWebRTC(localStreamRef);

  // === PRE-JOIN: Request camera/mic permissions ===
  useEffect(() => {
    let cancelled = false;
    const requestMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: prefCameraOn ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
          audio: prefMicOn,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setPreviewStream((prev) => {
          prev?.getTracks().forEach((t) => t.stop());
          return stream;
        });
        setPermError(null);
        setPermDenied(null);
      } catch (err: any) {
        console.error("Media error:", err);
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          if (!prefCameraOn && !prefMicOn) return;
          if (prefCameraOn && prefMicOn) setPermDenied("both");
          else if (prefCameraOn) setPermDenied("camera");
          else setPermDenied("mic");
        } else {
          setPermError("Could not access camera/microphone. " + (err.message || ""));
        }
      }
    };
    requestMedia();
    return () => { cancelled = true; };
  }, [prefCameraOn, prefMicOn]);

  // Attach preview stream to video element
  useEffect(() => {
    if (previewRef.current && previewStream) {
      previewRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // === JOIN ROOM ===
  const joinRoom = useCallback(async () => {
    setStage("connecting");

    // Use the preview stream as the final stream
    const stream = previewStream || await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsMuted(!prefMicOn);
    setIsCameraOff(!prefCameraOn);
  }, [previewStream, prefMicOn, prefCameraOn]);

  // === Socket + WebRTC connection (after media is ready) ===
  useEffect(() => {
    if (!roomId || !localStream || stage !== "connecting") return;

    const socket = getSocket();
    socket.connect();

    setOnRemoteStream((socketId, stream) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(socketId, stream);
        return next;
      });
    });

    setOnRemoteStreamLost((socketId) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    });

    socket.on("room-joined", (data: RoomState) => {
      setParticipant(data.participant);
      setParticipants(data.participants);
      setMessages(data.messages || []);
      setPoll(data.poll);
      setFiles(data.files || []);
      setIsLocked(data.isLocked);
      setHasWaitingRoom(data.hasWaitingRoom);
      setConnected(true);
      setStage("connected");

      for (const p of data.participants) {
        if (p.socketId !== socket.id) {
          connectToPeer(p.socketId);
        }
      }
    });

    socket.on("room-error", (data: { message: string }) => {
      setError(data.message);
      setStage("permissions");
    });

    socket.on("participant-joined", (data: { participant: Participant }) => {
      setParticipants((prev) => [...prev, data.participant]);
    });

    socket.on("participant-left", (data: { socketId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.socketId);
        return next;
      });
    });

    socket.on("participant-updated", (data: { participant: Participant }) => {
      setParticipants((prev) => prev.map((p) => p.socketId === data.participant.socketId ? data.participant : p));
    });

    socket.on("spotlight-changed", (data: { targetSocketId: string }) => {
      setParticipants((prev) => prev.map((p) => ({ ...p, isSpotlighted: p.socketId === data.targetSocketId })));
    });

    socket.on("new-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (activePanel !== "chat") setUnreadChat((prev) => prev + 1);
    });

    socket.on("poll-created", (data: { poll: Poll }) => { setPoll(data.poll); setShowPoll(true); });
    socket.on("poll-updated", (data: { poll: Poll }) => { setPoll(data.poll); });
    socket.on("file-shared", (data: { file: SharedFile }) => { setFiles((prev) => [...prev, data.file]); });
    socket.on("breakout-created", (data: { breakout: BreakoutRoom }) => { setBreakoutRooms((prev) => [...prev, data.breakout]); });
    socket.on("breakout-updated", (data: { breakoutRooms: BreakoutRoom[] }) => { setBreakoutRooms(data.breakoutRooms); });
    socket.on("waiting-room-update", (data: { waiting: WaitingUser[] }) => { setWaitingList(data.waiting); });
    socket.on("room-lock-changed", (data: { isLocked: boolean }) => { setIsLocked(data.isLocked); });
    socket.on("waiting-room-changed", (data: { hasWaitingRoom: boolean }) => { setHasWaitingRoom(data.hasWaitingRoom); });
    socket.on("recording-started", () => { setIsRecording(true); });
    socket.on("recording-stopped", () => { setIsRecording(false); });
    socket.on("all-muted", () => {
      setIsMuted(true);
      localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = false; });
    });

    socket.on("removed-from-room", () => {
      setRemoved(true);
      setTimeout(() => setLocation("/virtual-classroom"), 3000);
    });

    socket.on("class-ended", () => {
      cleanup();
      disconnectSocket();
      setLocation("/virtual-classroom");
    });

    socket.on("waiting-for-approval", () => {
      setError("Waiting for teacher to approve your entry...");
    });

    socket.on("join-denied", () => {
      setError("Your join request was denied by the teacher.");
    });

    socket.emit("join-room", { roomId, name: userName, role: userRole });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      disconnectSocket();
      cleanup();
    };
  }, [roomId, userName, userRole, localStream, stage]);

  // Media toggle handlers
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      getSocket().emit("toggle-mute");
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
      getSocket().emit("toggle-camera");
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      const stream = localStreamRef.current;
      if (stream) replaceTrack(stream.getVideoTracks()[0]);
      setIsScreenSharing(false);
      getSocket().emit("toggle-screen-share");
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        replaceTrack(screenTrack);
        setIsScreenSharing(true);
        getSocket().emit("toggle-screen-share");
        screenTrack.onended = () => {
          const camStream = localStreamRef.current;
          if (camStream) replaceTrack(camStream.getVideoTracks()[0]);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  }, [isScreenSharing, replaceTrack]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      getSocket().emit("stop-recording");
    } else {
      const stream = localStreamRef.current;
      if (!stream) return;
      try {
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsRecording(true);
        getSocket().emit("start-recording");
      } catch (err) {
        console.error("Recording failed:", err);
      }
    }
  }, [isRecording]);

  const endClass = useCallback(() => {
    previewStream?.getTracks().forEach((t) => t.stop());
    if (userRole === "teacher") {
      getSocket().emit("end-class");
    } else {
      getSocket().disconnect();
      disconnectSocket();
      cleanup();
      setLocation("/virtual-classroom");
    }
  }, [userRole, cleanup, setLocation, previewStream]);

  const handleOpenChat = () => { setActivePanel(activePanel === "chat" ? null : "chat"); setUnreadChat(0); };
  const handleOpenParticipants = () => setActivePanel(activePanel === "participants" ? null : "participants");

  // ===========================
  // PRE-JOIN PERMISSIONS SCREEN
  // ===========================
  if (stage === "permissions") {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 bg-zinc-950">
        <div className="w-full max-w-lg">
          {/* Back link */}
          <button
            onClick={() => { previewStream?.getTracks().forEach((t) => t.stop()); setLocation("/virtual-classroom"); }}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Lobby
          </button>

          {/* Camera preview */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 aspect-video mb-6">
            <video
              ref={previewRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                (!prefCameraOn || permDenied === "camera" || permDenied === "both") && "hidden"
              )}
            />
            {(!prefCameraOn || permDenied === "camera" || permDenied === "both") && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-4xl font-serif font-bold text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Name overlay */}
            <div className="absolute bottom-3 left-3">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm text-white">
                {userRole === "teacher" && (
                  <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded uppercase">Host</span>
                )}
                {userName} {userRole === "teacher" ? "(You)" : ""}
              </div>
            </div>

            {/* Mic indicator */}
            <div className="absolute bottom-3 right-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                prefMicOn && permDenied !== "mic" && permDenied !== "both" ? "bg-emerald-500/80" : "bg-red-500/80"
              )}>
                {prefMicOn && permDenied !== "mic" && permDenied !== "both"
                  ? <Mic size={14} className="text-white" />
                  : <MicOff size={14} className="text-white" />
                }
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => {
                setPrefCameraOn(!prefCameraOn);
                setPermDenied(null);
              }}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                prefCameraOn && !permDenied
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              )}
              title={prefCameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {prefCameraOn && !permDenied ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
            <button
              onClick={() => {
                setPrefMicOn(!prefMicOn);
                setPermDenied(null);
              }}
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                prefMicOn && !permDenied
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              )}
              title={prefMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {prefMicOn && !permDenied ? <Mic size={22} /> : <MicOff size={22} />}
            </button>
          </div>

          {/* Permission error */}
          {(permError || permDenied) && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-400 text-sm font-medium">
                {permDenied === "both" && "Camera and microphone access denied. Please allow permissions in your browser settings."}
                {permDenied === "camera" && "Camera access denied. Please allow camera in your browser settings."}
                {permDenied === "mic" && "Microphone access denied. Please allow microphone in your browser settings."}
                {permError && !permDenied && permError}
              </p>
              <button
                onClick={() => {
                  setPrefCameraOn(true);
                  setPrefMicOn(true);
                  setPermDenied(null);
                  setPermError(null);
                }}
                className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-colors"
              >
                Retry Permission Request
              </button>
            </div>
          )}

          {/* Join button */}
          <button
            onClick={joinRoom}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg text-lg"
          >
            <Phone size={20} /> Join Class
          </button>

          <p className="text-center text-xs text-zinc-600 mt-3">
            You can change your camera and mic settings during the class.
          </p>
        </div>
      </div>
    );
  }

  // ===========================
  // CONNECTING SCREEN
  // ===========================
  if (stage === "connecting" && !connected) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap size={28} className="text-primary" />
          </div>
          <p className="text-zinc-400 font-medium">Connecting to classroom...</p>
          <p className="text-zinc-600 text-sm mt-1">Please wait while we set up your connection</p>
        </div>
      </div>
    );
  }

  // ===========================
  // ERROR SCREEN
  // ===========================
  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 bg-zinc-950">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-serif font-bold text-white mb-2">
            {removed ? "Removed from Class" : "Connection Error"}
          </h2>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setError(null); setStage("permissions"); setRemoved(false); }}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            {removed ? "Return to Lobby" : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  // ===========================
  // CLASSROOM (CONNECTED)
  // ===========================
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-zinc-950 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <GraduationCap size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-zinc-500 uppercase">{userRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasWaitingRoom && userRole === "teacher" && (
            <button
              onClick={() => setShowWaiting(true)}
              className="px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors"
            >
              Waiting ({waitingList.length})
            </button>
          )}
          <span className="text-xs text-zinc-500 font-mono">
            {participants.length} participant{participants.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 relative">
          <VideoGrid
            participants={participants}
            remoteStreams={remoteStreams}
            localStream={localStream}
            localId={participant?.socketId || ""}
          />
          {showWhiteboard && (
            <Whiteboard
              onClose={() => setShowWhiteboard(false)}
              socket={getSocket()}
              roomId={roomId!}
            />
          )}
        </div>

        {activePanel === "chat" && (
          <ChatPanel
            messages={messages}
            currentUserId={participant?.socketId || ""}
            onSend={(content, isPrivate, recipientId) => {
              getSocket().emit("send-message", { content, isPrivate, recipientId });
            }}
            onClose={() => setActivePanel(null)}
          />
        )}
        {activePanel === "participants" && (
          <ParticipantList
            participants={participants}
            isTeacher={userRole === "teacher"}
            onSpotlight={(sid) => getSocket().emit("spotlight", { targetSocketId: sid })}
            onRemove={(sid) => getSocket().emit("remove-participant", { targetSocketId: sid })}
            onClose={() => setActivePanel(null)}
          />
        )}
      </div>

      {/* Control bar */}
      <ControlBar
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isHandRaised={participant?.isHandRaised || false}
        isTeacher={userRole === "teacher"}
        isRecording={isRecording}
        participantCount={participants.length}
        unreadChat={unreadChat}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleHandRaise={() => getSocket().emit("toggle-hand-raise")}
        onToggleRecording={toggleRecording}
        onEndClass={endClass}
        onOpenChat={handleOpenChat}
        onOpenParticipants={handleOpenParticipants}
        onOpenWhiteboard={() => setShowWhiteboard(!showWhiteboard)}
        onOpenFiles={() => setShowFiles(true)}
        onOpenPoll={() => setShowPoll(true)}
        onOpenBreakouts={() => setShowBreakouts(true)}
        onMuteAll={() => getSocket().emit("mute-all")}
        onToggleLock={() => getSocket().emit("lock-room")}
        isLocked={isLocked}
      />

      {/* Modals */}
      {showPoll && (
        <PollModal
          poll={poll}
          isTeacher={userRole === "teacher"}
          currentUserId={participant?.socketId || ""}
          onCreate={(question, options) => getSocket().emit("create-poll", { question, options })}
          onVote={(idx) => getSocket().emit("vote-poll", { optionIndex: idx })}
          onClose={() => setShowPoll(false)}
        />
      )}
      {showFiles && (
        <FileShare
          files={files}
          onShare={(file) => getSocket().emit("share-file", file)}
          onClose={() => setShowFiles(false)}
        />
      )}
      {showBreakouts && (
        <BreakoutRoomsPropsComponent
          breakoutRooms={breakoutRooms}
          participants={participants}
          currentSocketId={participant?.socketId || ""}
          isTeacher={userRole === "teacher"}
          onCreate={(name) => getSocket().emit("create-breakout", { name })}
          onJoin={(id) => getSocket().emit("join-breakout", { breakoutId: id })}
          onClose={() => setShowBreakouts(false)}
        />
      )}
      {showWaiting && (
        <WaitingRoom
          waiting={waitingList}
          onApprove={(sid) => getSocket().emit("approve-join", { socketId: sid })}
          onDeny={(sid) => getSocket().emit("deny-join", { socketId: sid })}
          onClose={() => setShowWaiting(false)}
        />
      )}
    </div>
  );
}
