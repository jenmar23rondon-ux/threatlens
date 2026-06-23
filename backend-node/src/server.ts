import http from "http";
import { Server } from "socket.io";
import { app } from "./app";
import { env, isAllowedOrigin } from "./config/env";
import { setSocket } from "./config/socket";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true
  }
});

setSocket(io);

io.on("connection", (socket) => {
  socket.emit("connected", { message: "ThreatLens realtime channel connected" });
});

server.listen(env.port, () => {
  console.log(`ThreatLens API running on http://localhost:${env.port}`);
});
