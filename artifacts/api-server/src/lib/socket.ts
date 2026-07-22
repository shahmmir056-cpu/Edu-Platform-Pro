import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import {
  joinRoom,
  leaveRoom,
  getRoom,
  approveWaiting,
  denyWaiting,
  removeParticipant,
  endRoom,
  getSocketRoom,
} from "./classroom";

export function setupSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    // ---- Room join ----
    socket.on("join-room", (data: { roomId: string; name: string; role: "teacher" | "student" }) => {
      const result = joinRoom({
        roomId: data.roomId,
        socketId: socket.id,
        name: data.name,
        role: data.role,
      });

      if ("error" in result) {
        socket.emit("room-error", { message: result.error });
        return;
      }

      if ("needsApproval" in result) {
        socket.emit("waiting-for-approval");
        const room = getRoom(data.roomId);
        if (room) {
          for (const [, p] of room.participants) {
            if (p.role === "teacher") {
              io.to(p.socketId).emit("waiting-room-update", {
                waiting: Array.from(room.waitingRoom.values()),
              });
            }
          }
        }
        return;
      }

      const { room, participant } = result;
      socket.join(room.id);

      socket.emit("room-joined", {
        roomId: room.id,
        participant,
        participants: Array.from(room.participants.values()),
        messages: room.messages,
        poll: room.poll,
        files: room.files,
        isLocked: room.isLocked,
        hasWaitingRoom: room.hasWaitingRoom,
      });

      socket.to(room.id).emit("participant-joined", { participant });
    });

    // ---- WebRTC signaling ----
    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // ---- Media controls ----
    socket.on("toggle-mute", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const p = room.participants.get(socket.id);
      if (p) {
        p.isMuted = !p.isMuted;
        io.to(room.id).emit("participant-updated", { participant: p });
      }
    });

    socket.on("toggle-camera", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const p = room.participants.get(socket.id);
      if (p) {
        p.isCameraOff = !p.isCameraOff;
        io.to(room.id).emit("participant-updated", { participant: p });
      }
    });

    socket.on("toggle-screen-share", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const p = room.participants.get(socket.id);
      if (p) {
        p.isScreenSharing = !p.isScreenSharing;
        io.to(room.id).emit("participant-updated", { participant: p });
      }
    });

    socket.on("toggle-hand-raise", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const p = room.participants.get(socket.id);
      if (p) {
        p.isHandRaised = !p.isHandRaised;
        io.to(room.id).emit("participant-updated", { participant: p });
      }
    });

    // ---- Spotlight ----
    socket.on("spotlight", ({ targetSocketId }: { targetSocketId: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const requester = room.participants.get(socket.id);
      if (!requester || requester.role !== "teacher") return;
      for (const [, p] of room.participants) {
        p.isSpotlighted = p.socketId === targetSocketId;
      }
      io.to(room.id).emit("spotlight-changed", { targetSocketId });
    });

    // ---- Chat ----
    socket.on("send-message", (data: { content: string; isPrivate?: boolean; recipientId?: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender) return;

      const msg = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        senderId: socket.id,
        senderName: sender.name,
        content: data.content,
        timestamp: new Date(),
        isPrivate: data.isPrivate || false,
        recipientId: data.recipientId,
      };

      room.messages.push(msg);

      if (data.isPrivate && data.recipientId) {
        io.to(data.recipientId).emit("new-message", msg);
        socket.emit("new-message", msg);
      } else {
        io.to(room.id).emit("new-message", msg);
      }
    });

    // ---- Polls ----
    socket.on("create-poll", (data: { question: string; options: string[] }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;

      room.poll = {
        id: Date.now().toString(36),
        question: data.question,
        options: data.options.map((text) => ({ text, votes: [] })),
        createdBy: socket.id,
        isActive: true,
        createdAt: new Date(),
      };
      io.to(room.id).emit("poll-created", { poll: room.poll });
    });

    socket.on("vote-poll", (data: { optionIndex: number }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room || !room.poll || !room.poll.isActive) return;
      for (const opt of room.poll.options) {
        opt.votes = opt.votes.filter((v) => v !== socket.id);
      }
      room.poll.options[data.optionIndex].votes.push(socket.id);
      io.to(room.id).emit("poll-updated", { poll: room.poll });
    });

    socket.on("close-poll", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room || !room.poll) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      room.poll.isActive = false;
      io.to(room.id).emit("poll-updated", { poll: room.poll });
    });

    // ---- File sharing ----
    socket.on("share-file", (data: { name: string; type: string; size: number; url: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender) return;

      const file = {
        id: Date.now().toString(36),
        name: data.name,
        type: data.type,
        size: data.size,
        url: data.url,
        sharedBy: socket.id,
        sharedByName: sender.name,
        sharedAt: new Date(),
      };
      room.files.push(file);
      io.to(room.id).emit("file-shared", { file });
    });

    // ---- Teacher controls ----
    socket.on("mute-all", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      for (const [, p] of room.participants) {
        if (p.socketId !== socket.id) p.isMuted = true;
      }
      io.to(room.id).emit("all-muted");
    });

    socket.on("remove-participant", ({ targetSocketId }: { targetSocketId: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;

      const removed = removeParticipant(targetSocketId);
      if (removed) {
        io.to(targetSocketId).emit("removed-from-room");
        io.to(room.id).emit("participant-left", { participantId: removed.participant.id, socketId: targetSocketId });
      }
    });

    socket.on("lock-room", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      room.isLocked = !room.isLocked;
      io.to(room.id).emit("room-lock-changed", { isLocked: room.isLocked });
    });

    socket.on("toggle-waiting-room", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      room.hasWaitingRoom = !room.hasWaitingRoom;
      io.to(room.id).emit("waiting-room-changed", { hasWaitingRoom: room.hasWaitingRoom });
    });

    socket.on("approve-join", ({ socketId }: { socketId: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;

      const result = approveWaiting(socketId);
      if (result) {
        socket.join(result.room.id);
        io.to(socketId).emit("room-joined", {
          roomId: result.room.id,
          participant: result.participant,
          participants: Array.from(result.room.participants.values()),
          messages: result.room.messages,
          poll: result.room.poll,
          files: result.room.files,
          isLocked: result.room.isLocked,
          hasWaitingRoom: result.room.hasWaitingRoom,
        });
        io.to(result.room.id).emit("participant-joined", { participant: result.participant });
        io.to(room.id).emit("waiting-room-update", {
          waiting: Array.from(room.waitingRoom.values()),
        });
      }
    });

    socket.on("deny-join", ({ socketId }: { socketId: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      denyWaiting(socketId);
      io.to(socketId).emit("join-denied");
      io.to(room.id).emit("waiting-room-update", {
        waiting: Array.from(room.waitingRoom.values()),
      });
    });

    // ---- Breakout rooms ----
    socket.on("create-breakout", ({ name }: { name: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      const br = { id: Date.now().toString(36), name, participants: [] };
      room.breakoutRooms.push(br);
      io.to(room.id).emit("breakout-created", { breakout: br });
    });

    socket.on("join-breakout", ({ breakoutId }: { breakoutId: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      for (const br of room.breakoutRooms) {
        br.participants = br.participants.filter((p) => p !== socket.id);
      }
      const br = room.breakoutRooms.find((b) => b.id === breakoutId);
      if (br) br.participants.push(socket.id);
      io.to(room.id).emit("breakout-updated", { breakoutRooms: room.breakoutRooms });
    });

    socket.on("close-breakout", ({ breakoutId }: { breakoutId: string }) => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      room.breakoutRooms = room.breakoutRooms.filter((b) => b.id !== breakoutId);
      io.to(room.id).emit("breakout-updated", { breakoutRooms: room.breakoutRooms });
    });

    // ---- Recording ----
    socket.on("start-recording", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const rec = { id: Date.now().toString(36), startedAt: new Date() };
      room.recordings.push(rec);
      io.to(room.id).emit("recording-started", { recording: rec });
    });

    socket.on("stop-recording", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const rec = room.recordings.find((r) => !r.stoppedAt);
      if (rec) rec.stoppedAt = new Date();
      io.to(room.id).emit("recording-stopped", {});
    });

    // ---- End class ----
    socket.on("end-class", () => {
      const roomId = getSocketRoom(socket.id);
      if (!roomId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const sender = room.participants.get(socket.id);
      if (!sender || sender.role !== "teacher") return;
      io.to(room.id).emit("class-ended");
      endRoom(roomId);
    });

    // ---- Disconnect ----
    socket.on("disconnect", () => {
      const result = leaveRoom(socket.id);
      if (result) {
        io.to(result.room.id).emit("participant-left", {
          participantId: result.participant.id,
          socketId: socket.id,
        });
      }
    });
  });

  return io;
}
