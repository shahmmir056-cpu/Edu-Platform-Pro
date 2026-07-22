import { useCallback, useRef, useEffect } from "react";
import { getSocket } from "./socket-client";
import type { Participant } from "./classroom-types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(localStreamRef: React.MutableRefObject<MediaStream | null>) {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const onRemoteStreamRef = useRef<((socketId: string, stream: MediaStream) => void) | null>(null);
  const onRemoteStreamLostRef = useRef<((socketId: string) => void) | null>(null);

  const setOnRemoteStream = useCallback((cb: (socketId: string, stream: MediaStream) => void) => {
    onRemoteStreamRef.current = cb;
  }, []);

  const setOnRemoteStreamLost = useCallback((cb: (socketId: string) => void) => {
    onRemoteStreamLostRef.current = cb;
  }, []);

  const createPeer = useCallback((targetSocketId: string, isInitiator: boolean) => {
    const existing = peersRef.current.get(targetSocketId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetSocketId, pc);

    const localStream = localStreamRef.current;
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream);
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        getSocket().emit("ice-candidate", { to: targetSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        remoteStreamsRef.current.set(targetSocketId, stream);
        onRemoteStreamRef.current?.(targetSocketId, stream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        remoteStreamsRef.current.delete(targetSocketId);
        onRemoteStreamLostRef.current?.(targetSocketId);
        peersRef.current.delete(targetSocketId);
      }
    };

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription) {
            getSocket().emit("offer", { to: targetSocketId, offer: pc.localDescription });
          }
        })
        .catch(console.error);
    }

    return pc;
  }, [localStreamRef]);

  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPeer(from, false);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (pc.localDescription) {
        getSocket().emit("answer", { to: from, answer: pc.localDescription });
      }
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  }, [createPeer]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit) => {
    const pc = peersRef.current.get(from);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  }, []);

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peersRef.current.get(from);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  }, []);

  const connectToPeer = useCallback((socketId: string) => {
    createPeer(socketId, true);
  }, [createPeer]);

  const replaceTrack = useCallback((track: MediaStreamTrack | null) => {
    for (const [, pc] of peersRef.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === track?.kind);
      if (sender && track) {
        sender.replaceTrack(track);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    for (const [, pc] of peersRef.current) {
      pc.close();
    }
    peersRef.current.clear();
    remoteStreamsRef.current.clear();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on("offer", ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
      handleOffer(from, offer);
    });

    socket.on("answer", ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
      handleAnswer(from, answer);
    });

    socket.on("ice-candidate", ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      handleIceCandidate(from, candidate);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [handleOffer, handleAnswer, handleIceCandidate]);

  return {
    connectToPeer,
    replaceTrack,
    cleanup,
    remoteStreamsRef,
    setOnRemoteStream,
    setOnRemoteStreamLost,
  };
}
