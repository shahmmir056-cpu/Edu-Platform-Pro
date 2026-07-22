export type ParticipantRole = "teacher" | "student";

export interface Participant {
  id: string;
  socketId: string;
  name: string;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isSpotlighted: boolean;
  stream?: MediaStream;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isPrivate: boolean;
  recipientId?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: string[] }[];
  createdBy: string;
  isActive: boolean;
  createdAt: string;
}

export interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  sharedBy: string;
  sharedByName: string;
  sharedAt: string;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
}

export interface WaitingUser {
  name: string;
  role: ParticipantRole;
  socketId: string;
}

export interface RoomState {
  roomId: string;
  participant: Participant;
  participants: Participant[];
  messages: ChatMessage[];
  poll: Poll | null;
  files: SharedFile[];
  isLocked: boolean;
  hasWaitingRoom: boolean;
}
