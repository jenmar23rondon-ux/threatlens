import { Server } from "socket.io";

let io: Server | null = null;

export function setSocket(server: Server) {
  io = server;
}

export function emitEvent(event: string, payload: unknown) {
  if (io) {
    io.emit(event, payload);
  }
}

