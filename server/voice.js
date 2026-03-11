function serializeVoicePeer(user) {
  return {
    id: user.id,
    name: user.name,
    hall: user.hall,
    currentArea: user.currentArea,
    micEnabled: Boolean(user.micEnabled)
  };
}

function logVoice(event, payload = {}) {
  console.log("[voice]", event, payload);
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
    logVoice("broadcast-voice-peers", {
      areaId,
      peerIds: peers.map((peer) => peer.id),
      micPeers: peers.filter((peer) => peer.micEnabled).map((peer) => peer.id)
    });
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
      logVoice("relay-skip-missing-user", {
        eventName,
        sourceId,
        targetId,
        hasSourceUser: Boolean(sourceUser),
        hasTargetUser: Boolean(targetUser)
      });
      return;
    }

    if (sourceUser.currentArea !== targetUser.currentArea) {
      logVoice("relay-skip-area-mismatch", {
        eventName,
        sourceId,
        targetId,
        sourceArea: sourceUser.currentArea,
        targetArea: targetUser.currentArea
      });
      return;
    }

    logVoice("relay-voice-event", {
      eventName,
      sourceId,
      targetId,
      areaId: sourceUser.currentArea,
      signalType: payload?.signal?.type,
      descriptionType: payload?.signal?.description?.type
    });
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

      logVoice("voice-state", {
        socketId: socket.id,
        areaId: user.currentArea,
        micEnabled: Boolean(payload.micEnabled)
      });
      user.micEnabled = Boolean(payload.micEnabled);
      broadcastVoicePeers(user.currentArea);
      ack?.({ ok: true, micEnabled: user.micEnabled });
    });

    socket.on("voice:sync", (ack) => {
      const user = users.get(socket.id);
      if (!user) {
        ack?.({ ok: false, message: "먼저 입장해야 합니다." });
        return;
      }

      const peers = getAreaVoiceUsers(user.currentArea).map(serializeVoicePeer);
      logVoice("voice-sync", {
        socketId: socket.id,
        areaId: user.currentArea,
        peerIds: peers.map((peer) => peer.id)
      });
      io.to(socket.id).emit("voice:peers", {
        areaId: user.currentArea,
        peers
      });
      ack?.({ ok: true, peers });
    });

    socket.on("voice:signal", (payload = {}, ack) => {
      const user = users.get(socket.id);
      logVoice("voice-signal-received", {
        socketId: socket.id,
        targetId: payload.targetId,
        signalType: payload.signal?.type,
        descriptionType: payload.signal?.description?.type
      });
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
      logVoice("voice-renegotiate-request", {
        socketId: socket.id,
        targetId: payload.targetId
      });
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
