import { v4 as uuid } from "uuid";

export type ParticipantRole = "teacher" | "student";

export interface Participant {
  id: string;
  socketId: string;
  name: string;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpotlighted: boolean;
}

export interface Classroom {
  id: string;
  code: string;
  title: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  scheduledAt?: Date;
  createdAt: Date;
  isActive: boolean;
  isLocked: boolean;
  hasWaitingRoom: boolean;
  participants: Map<string, Participant>;
  waitingRoom: Map<string, { name: string; role: ParticipantRole; socketId: string }>;
  attendance: { participantId: string; name: string; role: ParticipantRole; joinedAt: Date; leftAt?: Date }[];
  messages: ChatMessage[];
  poll?: Poll;
  files: SharedFile[];
  breakoutRooms: BreakoutRoom[];
  recordings: { id: string; startedAt: Date; stoppedAt?: Date }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isPrivate: boolean;
  recipientId?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: string[] }[];
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  sharedBy: string;
  sharedByName: string;
  sharedAt: Date;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
}

// In-memory store
const rooms = new Map<string, Classroom>();
const socketToRoom = new Map<string, string>();
const codeToRoomId = new Map<string, string>();

function generateCode(): string {
  let code: string;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (codeToRoomId.has(code));
  return code;
}

export function createRoom(params: {
  title: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  scheduledAt?: Date;
}): Classroom {
  const id = uuid();
  const code = generateCode();
  const room: Classroom = {
    id,
    code,
    title: params.title,
    subject: params.subject,
    teacherId: params.teacherId,
    teacherName: params.teacherName,
    scheduledAt: params.scheduledAt,
    createdAt: new Date(),
    isActive: true,
    isLocked: false,
    hasWaitingRoom: false,
    participants: new Map(),
    waitingRoom: new Map(),
    attendance: [],
    messages: [],
    files: [],
    breakoutRooms: [],
    recordings: [],
  };
  rooms.set(id, room);
  codeToRoomId.set(code, id);
  return room;
}

export function getRoom(id: string): Classroom | undefined {
  return rooms.get(id);
}

export function getRoomByCode(code: string): Classroom | undefined {
  const roomId = codeToRoomId.get(code);
  return roomId ? rooms.get(roomId) : undefined;
}

export function joinRoom(params: {
  roomId: string;
  socketId: string;
  name: string;
  role: ParticipantRole;
}): { room: Classroom; participant: Participant } | { needsApproval: true } | { error: string } {
  const room = rooms.get(params.roomId);
  if (!room) return { error: "Room not found" };
  if (!room.isActive) return { error: "Class has ended" };
  if (room.isLocked && params.role === "student") {
    return { error: "Class is locked. The teacher must unlock it to allow new participants." };
  }

  if (room.hasWaitingRoom && params.role === "student") {
    room.waitingRoom.set(params.socketId, {
      name: params.name,
      role: params.role,
      socketId: params.socketId,
    });
    return { needsApproval: true };
  }

  const participant: Participant = {
    id: uuid(),
    socketId: params.socketId,
    name: params.name,
    role: params.role,
    joinedAt: new Date(),
    isMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    isHandRaised: false,
    isSpotlighted: false,
  };

  room.participants.set(params.socketId, participant);
  room.attendance.push({
    participantId: participant.id,
    name: participant.name,
    role: participant.role,
    joinedAt: participant.joinedAt,
  });
  socketToRoom.set(params.socketId, params.roomId);

  return { room, participant };
}

export function approveWaiting(socketId: string): { room: Classroom; participant: Participant } | null {
  for (const room of rooms.values()) {
    const pending = room.waitingRoom.get(socketId);
    if (pending) {
      room.waitingRoom.delete(socketId);
      const participant: Participant = {
        id: uuid(),
        socketId: pending.socketId,
        name: pending.name,
        role: pending.role,
        joinedAt: new Date(),
        isMuted: false,
        isCameraOff: false,
        isScreenSharing: false,
        isHandRaised: false,
        isSpotlighted: false,
      };
      room.participants.set(socketId, participant);
      room.attendance.push({
        participantId: participant.id,
        name: participant.name,
        role: participant.role,
        joinedAt: participant.joinedAt,
      });
      socketToRoom.set(socketId, room.id);
      return { room, participant };
    }
  }
  return null;
}

export function denyWaiting(socketId: string): boolean {
  for (const room of rooms.values()) {
    if (room.waitingRoom.has(socketId)) {
      room.waitingRoom.delete(socketId);
      return true;
    }
  }
  return false;
}

export function leaveRoom(socketId: string): { room: Classroom; participant: Participant } | null {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) return null;

  const participant = room.participants.get(socketId);
  if (participant) {
    participant.leftAt = new Date();
    room.attendance.find((a) => a.participantId === participant.id && !a.leftAt).leftAt = participant.leftAt;
    room.participants.delete(socketId);
  }

  socketToRoom.delete(socketId);

  if (room.participants.size === 0) {
    room.isActive = false;
  }

  return participant ? { room, participant } : null;
}

export function removeParticipant(targetSocketId: string): { room: Classroom; participant: Participant } | null {
  return leaveRoom(targetSocketId);
}

export function endRoom(roomId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.isActive = false;
  for (const [sid] of room.participants) {
    socketToRoom.delete(sid);
  }
  return true;
}

export function getSocketRoom(socketId: string): string | undefined {
  return socketToRoom.get(socketId);
}

export function listActiveRooms(): { id: string; title: string; subject: string; teacherName: string; participantCount: number; code: string }[] {
  return Array.from(rooms.values())
    .filter((r) => r.isActive)
    .map((r) => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      teacherName: r.teacherName,
      participantCount: r.participants.size,
      code: r.code,
    }));
}
