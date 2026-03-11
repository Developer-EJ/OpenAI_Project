import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CORS_ORIGIN || "*";
const io = new Server(server, {
  cors: {
    origin: allowedOrigin
  }
});

const PORT = Number(process.env.PORT) || 3001;
const HALLS = ["sw-ai랩", "게임랩", "게임 테크랩"];
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 960;
const users = new Map();

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, halls: HALLS });
});

function clampPosition(position = {}) {
  const x = Math.max(56, Math.min(MAP_WIDTH - 56, Number(position.x) || 160));
  const y = Math.max(72, Math.min(MAP_HEIGHT - 72, Number(position.y) || 160));
  return { x, y };
}

function sanitizeProfile(payload = {}) {
  const name = String(payload.name || "").trim().slice(0, 14);
  const classroom = String(payload.classroom || "").trim().slice(0, 10);
  const hall = HALLS.includes(payload.hall) ? payload.hall : HALLS[0];
  const avatar = payload.avatar && typeof payload.avatar === "object" ? payload.avatar : null;
  return { name, classroom, hall, avatar };
}

function roomUsers(hall) {
  return Array.from(users.values()).filter((user) => user.hall === hall);
}

function broadcastHallState(hall) {
  io.to(hall).emit("hall:state", roomUsers(hall));
}

io.on("connection", (socket) => {
  socket.on("player:join", (payload, ack) => {
    const profile = sanitizeProfile(payload);
    if (!profile.name || !profile.classroom) {
      ack?.({ ok: false, message: "이름과 교육실이 필요합니다." });
      return;
    }

    const position = clampPosition(payload.position);
    const player = {
      id: socket.id,
      ...profile,
      position,
      joinedAt: Date.now(),
      lastMessage: ""
    };

    users.set(socket.id, player);
    socket.join(profile.hall);
    ack?.({ ok: true, player, users: roomUsers(profile.hall) });
    socket.to(profile.hall).emit("player:joined", player);
    broadcastHallState(profile.hall);
  });

  socket.on("player:move", (payload) => {
    const user = users.get(socket.id);
    if (!user) {
      return;
    }
    user.position = clampPosition(payload);
    socket.to(user.hall).emit("player:moved", {
      id: user.id,
      position: user.position
    });
  });

  socket.on("chat:send", (payload) => {
    const user = users.get(socket.id);
    if (!user) {
      return;
    }

    const message = String(payload.message || "").trim().slice(0, 120);
    const scope = payload.scope === "nearby" ? "nearby" : "global";
    if (!message) {
      return;
    }

    const chatPayload = {
      id: `${socket.id}-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      hall: user.hall,
      classroom: user.classroom,
      message,
      scope,
      createdAt: Date.now(),
      position: user.position
    };

    user.lastMessage = message;

    if (scope === "nearby") {
      const nearbyUsers = roomUsers(user.hall).filter((member) => {
        const dx = member.position.x - user.position.x;
        const dy = member.position.y - user.position.y;
        return Math.hypot(dx, dy) <= 220;
      });

      nearbyUsers.forEach((member) => {
        io.to(member.id).emit("chat:message", chatPayload);
      });
    } else {
      io.to(user.hall).emit("chat:message", chatPayload);
    }

    io.to(user.hall).emit("player:status", {
      id: user.id,
      lastMessage: message
    });
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) {
      return;
    }
    users.delete(socket.id);
    socket.to(user.hall).emit("player:left", { id: socket.id });
    broadcastHallState(user.hall);
  });
});

server.listen(PORT, () => {
  console.log(`Jungle Campus server listening on http://localhost:${PORT}`);
});
