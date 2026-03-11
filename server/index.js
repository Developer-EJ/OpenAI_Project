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
const AREA_IDS = ["lobby", "basketball", "classroom", "cafeteria"];
const PARTY_ENABLED_AREAS = AREA_IDS.filter((areaId) => areaId !== "lobby");
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 960;
const BASKETBALL_GAME_DURATION_MS = 45_000;
const BASKETBALL_SHOT_COOLDOWN_MS = 900;
const BASKETBALL_SHOT_ZONES = [
  { id: "paint", label: "골밑", x: 1310, y: 478, radius: 92, points: 2, successRate: 0.72 },
  { id: "wing", label: "윙", x: 1088, y: 308, radius: 86, points: 2, successRate: 0.56 },
  { id: "arc", label: "3점 라인", x: 1018, y: 692, radius: 98, points: 3, successRate: 0.38 }
];
const users = new Map();
const partiesByArea = new Map();
const basketballGames = new Map();

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, halls: HALLS, areas: AREA_IDS });
});

function createBasketballGame() {
  return {
    active: false,
    endsAt: 0,
    scores: {},
    playerNames: {},
    lastShot: null,
    timer: null
  };
}

function getBasketballGame(hall) {
  if (!basketballGames.has(hall)) {
    basketballGames.set(hall, createBasketballGame());
  }
  return basketballGames.get(hall);
}

function normalizeBasketballGame(hall) {
  const game = getBasketballGame(hall);
  if (game.active && game.endsAt <= Date.now()) {
    game.active = false;
    game.endsAt = 0;
    if (game.timer) {
      clearTimeout(game.timer);
      game.timer = null;
    }
    game.lastShot = {
      message: "경기 종료. 점수판을 확인해보세요.",
      made: false,
      points: 0,
      at: Date.now()
    };
  }
  return game;
}

function getHallUsers(hall) {
  return Array.from(users.values()).filter((user) => user.hall === hall);
}

function serializeBasketballState(hall) {
  const game = normalizeBasketballGame(hall);
  const hallUsers = getHallUsers(hall);
  const userNames = new Map(hallUsers.map((user) => [user.id, user.name]));
  const scoreboard = Object.entries(game.scores)
    .map(([id, score]) => ({
      id,
      name: game.playerNames[id] || userNames.get(id) || "Unknown Player",
      score
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "ko"));

  return {
    active: game.active,
    remainingMs: game.active ? Math.max(0, game.endsAt - Date.now()) : 0,
    endsAt: game.endsAt,
    scoreboard,
    lastShot: game.lastShot,
    zones: BASKETBALL_SHOT_ZONES.map(({ id, label, points, successRate }) => ({
      id,
      label,
      points,
      successRate
    }))
  };
}

function getNearestBasketballShotZone(position) {
  const matches = BASKETBALL_SHOT_ZONES
    .map((zone) => {
      const dx = position.x - zone.x;
      const dy = position.y - zone.y;
      const distance = Math.hypot(dx, dy);
      return distance <= zone.radius ? { ...zone, distance } : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.distance - right.distance);

  return matches[0] || null;
}

function getAreaRoomKey(hall, currentArea) {
  return `${hall}:${currentArea}`;
}

function broadcastBasketballState(hall) {
  io.to(getAreaRoomKey(hall, "basketball")).emit("basketball:state", serializeBasketballState(hall));
}

function endBasketballGame(hall, message = "경기 종료. 점수판을 확인해보세요.") {
  const game = getBasketballGame(hall);
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  game.active = false;
  game.endsAt = 0;
  game.lastShot = {
    message,
    made: false,
    points: 0,
    at: Date.now()
  };
  broadcastBasketballState(hall);
}

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
  const currentArea = AREA_IDS.includes(payload.currentArea) ? payload.currentArea : "lobby";
  return { name, classroom, hall, avatar, currentArea };
}

function roomUsers(hall, currentArea) {
  return Array.from(users.values()).filter(
    (user) => user.hall === hall && user.currentArea === currentArea
  );
}

function getPartyKey(hall, areaId) {
  return `${hall}:${areaId}`;
}

function getAreaParties(hall, areaId) {
  const key = getPartyKey(hall, areaId);
  if (!partiesByArea.has(key)) {
    partiesByArea.set(key, []);
  }
  return partiesByArea.get(key);
}

function serializeParty(party) {
  return {
    id: party.id,
    areaId: party.areaId,
    title: party.title,
    maxMembers: party.maxMembers,
    ownerId: party.ownerId,
    ownerName: party.ownerName,
    createdAt: party.createdAt,
    members: party.members.map((member) => ({
      id: member.id,
      name: member.name,
      classroom: member.classroom
    }))
  };
}

function broadcastAreaState(hall, areaId) {
  io.to(getAreaRoomKey(hall, areaId)).emit("area:state", {
    areaId,
    users: roomUsers(hall, areaId)
  });
}

function broadcastPartyList(hall, areaId) {
  io.to(getAreaRoomKey(hall, areaId)).emit(
    "party:list",
    getAreaParties(hall, areaId).map(serializeParty)
  );
}

function removeUserFromPartiesForArea(user, areaId) {
  if (!PARTY_ENABLED_AREAS.includes(areaId)) {
    return;
  }

  const nextParties = getAreaParties(user.hall, areaId)
    .map((party) => ({
      ...party,
      members: party.members.filter((member) => member.id !== user.id)
    }))
    .filter((party) => party.members.length > 0)
    .map((party) => {
      if (party.ownerId === user.id) {
        const nextOwner = party.members[0];
        return {
          ...party,
          ownerId: nextOwner.id,
          ownerName: nextOwner.name
        };
      }
      return party;
    });

  partiesByArea.set(getPartyKey(user.hall, areaId), nextParties);
  broadcastPartyList(user.hall, areaId);
}

function removeUserFromParties(user) {
  PARTY_ENABLED_AREAS.forEach((areaId) => {
    removeUserFromPartiesForArea(user, areaId);
  });
}

io.on("connection", (socket) => {
  socket.on("player:join", (payload, ack) => {
    const profile = sanitizeProfile(payload);
    if (!profile.name || !profile.classroom) {
      ack?.({ ok: false, message: "이름과 교육실은 필수입니다." });
      return;
    }

    const position = clampPosition(payload.position);
    const player = {
      id: socket.id,
      ...profile,
      position,
      joinedAt: Date.now(),
      lastMessage: "",
      lastBasketballShotAt: 0
    };

    const areaRoomKey = getAreaRoomKey(profile.hall, profile.currentArea);
    users.set(socket.id, player);
    socket.join(areaRoomKey);

    socket.to(areaRoomKey).emit("player:joined", player);
    broadcastAreaState(profile.hall, profile.currentArea);
    if (PARTY_ENABLED_AREAS.includes(profile.currentArea)) {
      broadcastPartyList(profile.hall, profile.currentArea);
    }

    ack?.({
      ok: true,
      message: `${profile.name}님, 캠퍼스에 입장했습니다.`,
      player,
      users: roomUsers(profile.hall, profile.currentArea),
      parties: getAreaParties(profile.hall, profile.currentArea).map(serializeParty),
      basketball: profile.currentArea === "basketball" ? serializeBasketballState(profile.hall) : null
    });

    if (profile.currentArea === "basketball") {
      socket.emit("basketball:state", serializeBasketballState(profile.hall));
    }
  });

  socket.on("area:change", (payload, ack) => {
    const user = users.get(socket.id);
    if (!user) {
      ack?.({ ok: false, message: "먼저 입장해야 합니다." });
      return;
    }

    const nextArea = AREA_IDS.includes(payload?.areaId) ? payload.areaId : "lobby";
    if (nextArea === user.currentArea) {
      ack?.({
        ok: true,
        areaId: user.currentArea,
        position: user.position,
        users: roomUsers(user.hall, user.currentArea),
        parties: getAreaParties(user.hall, user.currentArea).map(serializeParty)
      });
      return;
    }

    const previousArea = user.currentArea;
    const previousRoomKey = getAreaRoomKey(user.hall, previousArea);
    socket.leave(previousRoomKey);
    removeUserFromPartiesForArea(user, previousArea);

    user.currentArea = nextArea;
    user.position = clampPosition(payload?.position);
    user.lastMessage = "";
    const nextRoomKey = getAreaRoomKey(user.hall, nextArea);
    socket.join(nextRoomKey);

    socket.to(previousRoomKey).emit("player:left", { id: user.id });
    socket.to(nextRoomKey).emit("player:joined", user);
    io.to(nextRoomKey).emit("area:changed", {
      playerId: user.id,
      areaId: nextArea,
      position: user.position
    });

    broadcastAreaState(user.hall, previousArea);
    broadcastAreaState(user.hall, nextArea);
    if (PARTY_ENABLED_AREAS.includes(nextArea)) {
      broadcastPartyList(user.hall, nextArea);
    }
    if (nextArea === "basketball" || previousArea === "basketball") {
      broadcastBasketballState(user.hall);
    }
    if (nextArea === "basketball") {
      socket.emit("basketball:state", serializeBasketballState(user.hall));
    }

    ack?.({
      ok: true,
      areaId: nextArea,
      position: user.position,
      users: roomUsers(user.hall, nextArea),
      parties: getAreaParties(user.hall, nextArea).map(serializeParty)
    });
  });

  socket.on("player:move", (payload) => {
    const user = users.get(socket.id);
    if (!user) {
      return;
    }
    user.position = clampPosition(payload);
    socket.to(getAreaRoomKey(user.hall, user.currentArea)).emit("player:moved", {
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
      position: user.position,
      areaId: user.currentArea
    };

    user.lastMessage = message;
    const areaUsers = roomUsers(user.hall, user.currentArea);

    if (scope === "nearby") {
      const nearbyUsers = areaUsers.filter((member) => {
        const dx = member.position.x - user.position.x;
        const dy = member.position.y - user.position.y;
        return Math.hypot(dx, dy) <= 220;
      });

      nearbyUsers.forEach((member) => {
        io.to(member.id).emit("chat:message", chatPayload);
      });
    } else {
      io.to(getAreaRoomKey(user.hall, user.currentArea)).emit("chat:message", chatPayload);
    }

    io.to(getAreaRoomKey(user.hall, user.currentArea)).emit("player:status", {
      id: user.id,
      lastMessage: message
    });
  });

  socket.on("party:create", (payload, ack) => {
    const user = users.get(socket.id);
    if (!user) {
      ack?.({ ok: false, message: "먼저 입장해야 합니다." });
      return;
    }

    if (!PARTY_ENABLED_AREAS.includes(user.currentArea)) {
      ack?.({ ok: false, message: "메인 로비에서는 파티를 만들 수 없습니다." });
      return;
    }

    const title = String(payload?.title || "").trim().slice(0, 32);
    const maxMembers = Math.max(2, Math.min(8, Number(payload?.maxMembers) || 4));
    if (!title) {
      ack?.({ ok: false, message: "파티 제목을 입력해주세요." });
      return;
    }

    const parties = getAreaParties(user.hall, user.currentArea);
    const existingParty = parties.find((party) => party.members.some((member) => member.id === user.id));
    if (existingParty) {
      ack?.({ ok: false, message: "이미 이 공간의 파티에 참가 중입니다." });
      return;
    }

    parties.unshift({
      id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      areaId: user.currentArea,
      title,
      maxMembers,
      ownerId: user.id,
      ownerName: user.name,
      createdAt: Date.now(),
      members: [user]
    });

    broadcastPartyList(user.hall, user.currentArea);
    ack?.({ ok: true, message: "파티가 등록되었습니다." });
  });

  socket.on("party:join", (payload, ack) => {
    const user = users.get(socket.id);
    if (!user) {
      ack?.({ ok: false, message: "먼저 입장해야 합니다." });
      return;
    }

    if (!PARTY_ENABLED_AREAS.includes(user.currentArea)) {
      ack?.({ ok: false, message: "현재 공간에서는 파티에 참가할 수 없습니다." });
      return;
    }

    const parties = getAreaParties(user.hall, user.currentArea);
    const party = parties.find((item) => item.id === payload?.partyId);
    if (!party) {
      ack?.({ ok: false, message: "파티를 찾을 수 없습니다." });
      return;
    }

    if (party.members.some((member) => member.id === user.id)) {
      ack?.({ ok: false, message: "이미 참가한 파티입니다." });
      return;
    }

    if (party.members.length >= party.maxMembers) {
      ack?.({ ok: false, message: "정원이 가득 찼습니다." });
      return;
    }

    const existingParty = parties.find((item) => item.members.some((member) => member.id === user.id));
    if (existingParty) {
      ack?.({ ok: false, message: "한 공간에서는 하나의 파티에만 참가할 수 있습니다." });
      return;
    }

    party.members.push(user);
    broadcastPartyList(user.hall, user.currentArea);
    ack?.({ ok: true, message: `${party.title} 파티에 참가했습니다.` });
  });

  socket.on("basketball:start", (ack) => {
    const user = users.get(socket.id);
    if (!user || user.currentArea !== "basketball") {
      ack?.({ ok: false, message: "농구장에서만 게임을 시작할 수 있습니다." });
      return;
    }

    const game = normalizeBasketballGame(user.hall);
    if (game.active) {
      ack?.({ ok: false, message: "이미 진행 중인 농구 게임이 있습니다." });
      return;
    }

    game.active = true;
    game.endsAt = Date.now() + BASKETBALL_GAME_DURATION_MS;
    game.scores = {};
    game.playerNames = {};
    roomUsers(user.hall, "basketball").forEach((player) => {
      game.playerNames[player.id] = player.name;
    });
    game.lastShot = {
      message: `${user.name}님이 45초 슛 챌린지를 시작했습니다!`,
      made: false,
      points: 0,
      at: Date.now()
    };
    game.timer = setTimeout(() => {
      endBasketballGame(user.hall);
    }, BASKETBALL_GAME_DURATION_MS + 50);

    broadcastBasketballState(user.hall);
    ack?.({ ok: true, message: "농구 게임 시작! 슛 존으로 이동해보세요." });
  });

  socket.on("basketball:shoot", (ack) => {
    const user = users.get(socket.id);
    if (!user || user.currentArea !== "basketball") {
      ack?.({ ok: false, message: "농구장에서만 슛할 수 있습니다." });
      return;
    }

    const game = normalizeBasketballGame(user.hall);
    if (!game.active) {
      ack?.({ ok: false, message: "먼저 경기 시작 버튼을 눌러주세요." });
      return;
    }

    const now = Date.now();
    if (now - (user.lastBasketballShotAt || 0) < BASKETBALL_SHOT_COOLDOWN_MS) {
      ack?.({ ok: false, message: "조금만 기다린 뒤 다시 슛해보세요." });
      return;
    }

    const zone = getNearestBasketballShotZone(user.position);
    if (!zone) {
      ack?.({ ok: false, message: "슛 존 안으로 들어가야 슛할 수 있습니다." });
      return;
    }

    user.lastBasketballShotAt = now;
    game.playerNames[user.id] = user.name;
    const made = Math.random() < zone.successRate;
    const points = made ? zone.points : 0;
    if (made) {
      game.scores[user.id] = (game.scores[user.id] || 0) + points;
    }

    game.lastShot = {
      userId: user.id,
      playerName: user.name,
      zoneId: zone.id,
      zoneLabel: zone.label,
      made,
      points,
      at: now,
      message: made
        ? `${user.name}님이 ${zone.label}에서 ${points}점을 성공했어요!`
        : `${user.name}님의 ${zone.label} 슛이 아쉽게 빗나갔습니다.`
    };

    broadcastBasketballState(user.hall);
    ack?.({ ok: true, message: game.lastShot.message });
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (!user) {
      return;
    }
    users.delete(socket.id);
    removeUserFromParties(user);
    socket.to(getAreaRoomKey(user.hall, user.currentArea)).emit("player:left", { id: socket.id });
    broadcastAreaState(user.hall, user.currentArea);
    if (user.currentArea === "basketball") {
      broadcastBasketballState(user.hall);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Jungle Campus server listening on http://localhost:${PORT}`);
});
