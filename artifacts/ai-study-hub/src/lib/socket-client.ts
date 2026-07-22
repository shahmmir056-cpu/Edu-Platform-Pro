import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = window.location.hostname === "localhost"
      ? `http://${window.location.hostname}:8080`
      : window.location.origin;
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
