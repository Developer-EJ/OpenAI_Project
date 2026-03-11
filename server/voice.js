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
  function getAreaVoiceUsers(areaId) {
    return Array.from(users.values()).filter((user) => user.currentArea === areaId);
  }

  function broadcastVoicePeers(areaId) {
    if (!areaId) {
      return;
    }

    const peers = getAreaVoiceUsers(areaId).map(serializeVoicePeer);
    peers.forEach((peer) => {
      io.to(peer.id).emit("voice:peers", {
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

    if (sourceUser.currentArea !== targetUser.currentArea) {
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
      broadcastVoicePeers(user.currentArea);
      ack?.({ ok: true, micEnabled: user.micEnabled });
    });

    socket.on("voice:signal", (payload = {}, ack) => {
      const user = users.get(socket.id);
      if (!user || !payload.targetId || !payload.signal) {
        ack?.({ ok: false });
        return;
      }

      const targetUser = users.get(payload.targetId);
      if (!targetUser || targetUser.currentArea !== user.currentArea) {
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
      if (!targetUser || targetUser.currentArea !== user.currentArea) {
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
      broadcastVoicePeers(user.currentArea);
    },
    handleAreaChanged(previousArea, nextArea) {
      broadcastVoicePeers(previousArea);
      broadcastVoicePeers(nextArea);
    },
    handleUserDisconnected(user) {
      broadcastVoicePeers(user.currentArea);
    }
  };
}
