import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getServerUrl(): string {
  if (window.location.hostname === "localhost") {
    return `http://${window.location.hostname}:8080`;
  }
  return window.location.origin;
}

export function isSocketSupported(): boolean {
  return window.location.hostname === "localhost";
}

export function getSocket(): Socket {
  if (!socket) {
    const url = getServerUrl();
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      timeout: 8000,
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
