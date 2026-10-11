import cors from "cors";
import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import { Server } from "socket.io";
import { roomIdSchema } from "@cinecouch/shared";
import { config } from "./config";
import { InMemoryRoomStore } from "./rooms/room-store";
import { RoomService } from "./rooms/room-service";
import { registerSocketHandlers } from "./socket/handlers";

const app = express();
const httpServer = createServer(app);

const roomStore = new InMemoryRoomStore();
const roomService = new RoomService(roomStore);

const io = new Server(httpServer, {
  cors: {
    origin: config.clientOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 20000,
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: config.clientOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));

const createRoomLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many rooms created. Please try again shortly." },
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, rooms: roomStore.size() });
});

app.post("/api/rooms", createRoomLimiter, (_req: Request, res: Response) => {
  const { room, creatorToken } = roomService.createRoom();
  res.status(201).json({ roomId: room.roomId, creatorToken });
});

app.get("/api/rooms/:roomId", (req: Request<{ roomId: string }>, res: Response) => {
  const parsed = roomIdSchema.safeParse(req.params.roomId);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid room ID", code: "INVALID_ROOM_ID" });
    return;
  }

  const room = roomService.getPublicRoom(parsed.data);
  if (!room) {
    res.status(404).json({ error: "Room not found", code: "ROOM_NOT_FOUND" });
    return;
  }
  res.json(room);
});

registerSocketHandlers(io, roomService);

const cleanupTimer = setInterval(() => {
  const deleted = roomService.cleanupExpiredRooms();
  for (const roomId of deleted) {
    io.to(roomId).emit("room:expired", {
      code: "ROOM_EXPIRED",
      message: "This room has expired due to inactivity.",
    });
    io.in(roomId).socketsLeave(roomId);
  }
}, config.roomCleanupIntervalMs);

cleanupTimer.unref();

function shutdown(signal: string) {
  clearInterval(cleanupTimer);
  httpServer.close(() => {
    if (config.isDev) {
      console.log(`Server stopped (${signal})`);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
}

httpServer.listen(config.port, () => {
  if (config.isDev) {
      console.log(`Cove server listening on http://localhost:${config.port}`);
  }
});

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${config.port} is already in use. Run "npm run predev" from the project root, or stop the other process.`
    );
    process.exit(1);
  }
  throw err;
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
