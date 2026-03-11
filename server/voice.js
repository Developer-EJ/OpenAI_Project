function serializeVoicePeer(user) {
  return {
    id: user.id,
    name: user.name,
    hall: user.hall,
    currentArea: user.currentArea,
    micEnabled: Boolean(user.micEnabled)
  };
}

export function createVoiceServer({ io, users }) {
  function getAreaVoiceUsers(hall, areaId) {
    return Array.from(users.values()).filter(
      (user) => user.hall === hall && user.currentArea === areaId
    );
  }

  function broadcastVoicePeers(hall, areaId) {
    if (!hall || !areaId) {
      return;
    }

    const peers = getAreaVoiceUsers(hall, areaId).map(serializeVoicePeer);
    peers.forEach((peer) => {
      io.to(peer.id).emit("voice:peers", {
        hall,
        areaId,
        peers
      });
    });
  }

  function relayVoiceEvent(sourceId, targetId, eventName, payload) {
    const sourceUser = users.get(sourceId);
    const targetUser = users.get(targetId);

    if (!sourceUser || !targetUser) {
      return;
    }

    if (
      sourceUser.hall !== targetUser.hall ||
      sourceUser.currentArea !== targetUser.currentArea
    ) {
      return;
    }

    io.to(targetId).emit(eventName, {
      fromId: sourceId,
      ...payload
    });
  }

  function registerSocket(socket) {
    socket.on("voice:state", (payload = {}, ack) => {
      const user = users.get(socket.id);
      if (!user) {
        ack?.({ ok: false, message: "먼저 입장해야 합니다." });
        return;
      }

      user.micEnabled = Boolean(payload.micEnabled);
      broadcastVoicePeers(user.hall, user.currentArea);
      ack?.({ ok: true, micEnabled: user.micEnabled });
    });

    socket.on("voice:sync", (ack) => {
      const user = users.get(socket.id);
      if (!user) {
        ack?.({ ok: false, message: "먼저 입장해야 합니다." });
        return;
      }

      const peers = getAreaVoiceUsers(user.hall, user.currentArea).map(serializeVoicePeer);
      io.to(socket.id).emit("voice:peers", {
        hall: user.hall,
        areaId: user.currentArea,
        peers
      });
      ack?.({ ok: true, peers });
    });

    socket.on("voice:signal", (payload = {}, ack) => {
      const user = users.get(socket.id);
      if (!user || !payload.targetId || !payload.signal) {
        ack?.({ ok: false });
        return;
      }

      const targetUser = users.get(payload.targetId);
      if (
        !targetUser ||
        targetUser.hall !== user.hall ||
        targetUser.currentArea !== user.currentArea
      ) {
        ack?.({ ok: false, message: "같은 공간의 사용자에게만 연결할 수 있습니다." });
        return;
      }

      relayVoiceEvent(socket.id, payload.targetId, "voice:signal", {
        signal: payload.signal
      });
      ack?.({ ok: true });
    });

    socket.on("voice:renegotiate-request", (payload = {}, ack) => {
      const user = users.get(socket.id);
      if (!user || !payload.targetId) {
        ack?.({ ok: false });
        return;
      }

      const targetUser = users.get(payload.targetId);
      if (
        !targetUser ||
        targetUser.hall !== user.hall ||
        targetUser.currentArea !== user.currentArea
      ) {
        ack?.({ ok: false, message: "같은 공간의 사용자에게만 요청할 수 있습니다." });
        return;
      }

      relayVoiceEvent(socket.id, payload.targetId, "voice:renegotiate-request", {});
      ack?.({ ok: true });
    });
  }

  return {
    registerSocket,
    handleUserJoined(user) {
      broadcastVoicePeers(user.hall, user.currentArea);
    },
    handleAreaChanged(hall, previousArea, nextArea) {
      broadcastVoicePeers(hall, previousArea);
      broadcastVoicePeers(hall, nextArea);
    },
    handleUserDisconnected(user) {
      broadcastVoicePeers(user.hall, user.currentArea);
    }
  };
}
