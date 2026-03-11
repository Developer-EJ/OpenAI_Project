import { useEffect, useRef, useState } from "react";
import { ICE_SERVERS } from "../../constants";

function logVoice(event, payload = {}) {
  console.log("[voice]", event, payload);
}

function shouldInitiateOffer(selfId, peerId) {
  return String(selfId) > String(peerId);
}

function countLiveAudioTracks(stream) {
  return stream
    .getAudioTracks()
    .filter((track) => track.readyState === "live").length;
}

function describeMediaError(error) {
  if (error?.name === "NotAllowedError") {
    return "마이크 권한이 없어 송신을 시작할 수 없습니다.";
  }

  if (error?.name === "NotFoundError") {
    return "사용 가능한 마이크를 찾을 수 없습니다.";
  }

  return "마이크를 시작하는 중 문제가 발생했습니다.";
}

export function useAreaVoice({ socket, selfId, enabled, candidatePeers = [] }) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [peerSummaries, setPeerSummaries] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [voiceError, setVoiceError] = useState("");
  const connectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const pendingIceRef = useRef(new Map());
  const lastSyncSignatureRef = useRef("");

  function getPeerSetSignature(peerIds) {
    return Array.from(new Set((peerIds || []).filter(Boolean))).sort().join("|");
  }

  function clearRemoteStream(peerId) {
    setRemoteStreams((current) => current.filter((item) => item.peerId !== peerId));
  }

  function upsertRemoteStream(peerId, stream) {
    setRemoteStreams((current) => {
      const next = current.filter((item) => item.peerId !== peerId);
      next.push({
        peerId,
        stream,
        trackCount: countLiveAudioTracks(stream)
      });
      return next;
    });
  }

  function closePeerConnection(peerId) {
    const entry = connectionsRef.current.get(peerId);
    if (!entry) {
      return;
    }

    logVoice("close-peer-connection", {
      peerId,
      connectionState: entry.pc.connectionState,
      iceConnectionState: entry.pc.iceConnectionState
    });
    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
    entry.pc.onconnectionstatechange = null;
    entry.pc.close();
    connectionsRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
    lastSyncSignatureRef.current = "";
    clearRemoteStream(peerId);
  }

  function closeAllPeerConnections() {
    Array.from(connectionsRef.current.keys()).forEach((peerId) => {
      closePeerConnection(peerId);
    });
  }

  function stopLocalStream() {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }

  async function ensureLocalStream() {
    if (localStreamRef.current) {
      logVoice("reuse-local-stream");
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    logVoice("local-stream-ready", {
      trackIds: stream.getAudioTracks().map((track) => track.id)
    });
    return stream;
  }

  async function syncLocalTrack(entry) {
    const localTrack = localStreamRef.current?.getAudioTracks()?.[0] || null;
    await entry.audioTransceiver.sender.replaceTrack(localTrack);
    entry.audioTransceiver.direction = localTrack ? "sendrecv" : "recvonly";
  }

  async function flushPendingIce(peerId) {
    const entry = connectionsRef.current.get(peerId);
    const pending = pendingIceRef.current.get(peerId) || [];
    if (!entry?.pc.remoteDescription || pending.length === 0) {
      return;
    }

    pendingIceRef.current.delete(peerId);
    await Promise.all(
      pending.map((candidate) =>
        entry.pc.addIceCandidate(candidate).catch(() => undefined)
      )
    );
  }

  function ensurePeerConnection(peerId) {
    const existing = connectionsRef.current.get(peerId);
    if (existing) {
      return existing;
    }

    logVoice("create-peer-connection", {
      peerId,
      iceServerCount: ICE_SERVERS.iceServers.length,
      urls: ICE_SERVERS.iceServers.map((server) => server.urls)
    });
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();
    const audioTransceiver = pc.addTransceiver("audio", { direction: "recvonly" });

    pc.ontrack = (event) => {
      logVoice("remote-track", {
        peerId,
        trackKind: event.track?.kind,
        streamCount: event.streams.length
      });
      const audioTracks = [];

      if (event.track?.kind === "audio") {
        audioTracks.push(event.track);
      }

      event.streams.forEach((stream) => {
        stream.getAudioTracks().forEach((track) => {
          if (!audioTracks.some((item) => item.id === track.id)) {
            audioTracks.push(track);
          }
        });
      });

      audioTracks.forEach((track) => {
        if (!remoteStream.getAudioTracks().some((item) => item.id === track.id)) {
          remoteStream.addTrack(track);
        }

        track.onunmute = () => {
          upsertRemoteStream(peerId, remoteStream);
        };
        track.onended = () => {
          upsertRemoteStream(peerId, remoteStream);
        };
      });

      upsertRemoteStream(peerId, remoteStream);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        logVoice("ice-candidate-complete", { peerId });
        return;
      }

      logVoice("emit-candidate", {
        peerId,
        candidate: event.candidate.candidate
      });
      socket.emit("voice:signal", {
        targetId: peerId,
        signal: {
          type: "candidate",
          candidate: event.candidate
        }
      });
    };

    pc.onconnectionstatechange = () => {
      logVoice("connection-state-change", {
        peerId,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState
      });
      if (["closed", "failed", "disconnected"].includes(pc.connectionState)) {
        closePeerConnection(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      logVoice("ice-connection-state-change", {
        peerId,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState
      });
    };

    const next = {
      pc,
      remoteStream,
      audioTransceiver,
      makingOffer: false,
      awaitingAnswer: false
    };
    connectionsRef.current.set(peerId, next);
    return next;
  }

  async function createOffer(peerId) {
    const entry = ensurePeerConnection(peerId);
    if (entry.makingOffer || entry.awaitingAnswer || entry.pc.signalingState !== "stable") {
      logVoice("create-offer-skip", {
        peerId,
        makingOffer: entry.makingOffer,
        awaitingAnswer: entry.awaitingAnswer,
        signalingState: entry.pc.signalingState
      });
      return;
    }

    entry.makingOffer = true;
    logVoice("create-offer-start", { peerId });
    try {
      await syncLocalTrack(entry);
      const offer = await entry.pc.createOffer();
      await entry.pc.setLocalDescription(offer);
      entry.awaitingAnswer = true;
      logVoice("set-local-description", {
        peerId,
        type: entry.pc.localDescription?.type
      });
      socket.emit("voice:signal", {
        targetId: peerId,
        signal: {
          type: "description",
          description: entry.pc.localDescription
        }
      });
    } finally {
      entry.makingOffer = false;
    }
  }

  async function requestNegotiation(peerId) {
    logVoice("request-negotiation", {
      peerId,
      selfId,
      shouldInitiate: shouldInitiateOffer(selfId, peerId)
    });
    if (shouldInitiateOffer(selfId, peerId)) {
      await createOffer(peerId);
      return;
    }

    socket.emit("voice:renegotiate-request", { targetId: peerId });
  }

  async function refreshPeerNegotiation(peerIds) {
    await Promise.all(peerIds.map((peerId) => requestNegotiation(peerId).catch(() => undefined)));
  }

  async function toggleMic() {
    const nextMicEnabled = !micEnabled;
    logVoice("toggle-mic", { nextMicEnabled });

    if (nextMicEnabled) {
      try {
        await ensureLocalStream();
        setVoiceError("");
      } catch (error) {
        logVoice("toggle-mic-error", {
          name: error?.name,
          message: error?.message
        });
        setVoiceError(describeMediaError(error));
        setMicEnabled(false);
        socket.emit("voice:state", { micEnabled: false });
        return;
      }
    } else {
      stopLocalStream();
    }

    setMicEnabled(nextMicEnabled);
    socket.emit("voice:state", { micEnabled: nextMicEnabled });
    await refreshPeerNegotiation(Array.from(connectionsRef.current.keys()));
  }

  function toggleSound() {
    setSoundEnabled((current) => !current);
  }

  async function syncDesiredPeers(peerIds) {
    const nextPeerIds = new Set((peerIds || []).filter((peerId) => peerId && peerId !== selfId));
    const signature = getPeerSetSignature(Array.from(nextPeerIds));
    const hasAllConnections = Array.from(nextPeerIds).every((peerId) =>
      connectionsRef.current.has(peerId)
    );
    if (signature === lastSyncSignatureRef.current && hasAllConnections) {
      logVoice("sync-desired-peers-skip", {
        selfId,
        peerIds: Array.from(nextPeerIds)
      });
      return;
    }

    lastSyncSignatureRef.current = signature;
    logVoice("sync-desired-peers", {
      selfId,
      peerIds: Array.from(nextPeerIds)
    });
    Array.from(connectionsRef.current.keys()).forEach((peerId) => {
      if (!nextPeerIds.has(peerId)) {
        closePeerConnection(peerId);
      }
    });

    await Promise.all(
      Array.from(nextPeerIds).map(async (peerId) => {
        ensurePeerConnection(peerId);
        if (
          shouldInitiateOffer(selfId, peerId) &&
          !connectionsRef.current.get(peerId)?.pc.remoteDescription
        ) {
          await createOffer(peerId);
        }
      })
    );
  }

  useEffect(() => {
    if (!enabled || !selfId) {
      setPeerSummaries([]);
      setRemoteStreams([]);
      setMicEnabled(false);
      setSoundEnabled(true);
      setVoiceError("");
      closeAllPeerConnections();
      stopLocalStream();
      return undefined;
    }

    function handleKeyDown(event) {
      const tagName = event.target?.tagName || "";
      if (
        event.repeat ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tagName)
      ) {
        return;
      }

      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        void toggleMic();
      }

      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        toggleSound();
      }
    }

    async function handleVoicePeers({ peers }) {
      const nextPeers = (peers || []).filter((peer) => peer.id !== selfId);
      logVoice("voice-peers", {
        selfId,
        peerIds: nextPeers.map((peer) => peer.id),
        micPeers: nextPeers.filter((peer) => peer.micEnabled).map((peer) => peer.id)
      });
      setPeerSummaries(nextPeers);
      const desiredPeerIds = Array.from(
        new Set([
          ...nextPeers.map((peer) => peer.id),
          ...candidatePeers.map((peer) => peer.id)
        ])
      );
      await syncDesiredPeers(desiredPeerIds);
    }

    async function handleVoiceSignal({ fromId, signal }) {
      if (!fromId || !signal) {
        return;
      }

      logVoice("voice-signal-received", {
        fromId,
        type: signal.type,
        descriptionType: signal.description?.type
      });
      const entry = ensurePeerConnection(fromId);

      if (signal.type === "candidate") {
        if (entry.pc.remoteDescription) {
          await entry.pc.addIceCandidate(signal.candidate).catch((error) => {
            logVoice("add-ice-candidate-error", {
              fromId,
              message: error?.message
            });
            return undefined;
          });
          logVoice("add-ice-candidate", { fromId });
        } else {
          const pending = pendingIceRef.current.get(fromId) || [];
          pending.push(signal.candidate);
          pendingIceRef.current.set(fromId, pending);
          logVoice("queue-ice-candidate", {
            fromId,
            pendingCount: pending.length
          });
        }
        return;
      }

      if (signal.type !== "description") {
        return;
      }

      await syncLocalTrack(entry);
      await entry.pc.setRemoteDescription(signal.description);
      entry.awaitingAnswer = false;
      logVoice("set-remote-description", {
        fromId,
        type: signal.description.type
      });
      await flushPendingIce(fromId);

      if (signal.description.type === "offer") {
        const answer = await entry.pc.createAnswer();
        await entry.pc.setLocalDescription(answer);
        logVoice("set-local-description", {
          peerId: fromId,
          type: entry.pc.localDescription?.type
        });
        socket.emit("voice:signal", {
          targetId: fromId,
          signal: {
            type: "description",
            description: entry.pc.localDescription
          }
        });
      }
    }

    function handleRenegotiateRequest({ fromId }) {
      logVoice("renegotiate-request", {
        fromId,
        selfId,
        shouldInitiate: shouldInitiateOffer(selfId, fromId)
      });
      if (!fromId || !shouldInitiateOffer(selfId, fromId)) {
        return;
      }

      void createOffer(fromId);
    }

    window.addEventListener("keydown", handleKeyDown);
    socket.on("voice:peers", handleVoicePeers);
    socket.on("voice:signal", handleVoiceSignal);
    socket.on("voice:renegotiate-request", handleRenegotiateRequest);
    logVoice("voice-sync-start", { selfId });
    socket.emit("voice:sync");
    socket.emit("voice:state", { micEnabled: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      socket.off("voice:peers", handleVoicePeers);
      socket.off("voice:signal", handleVoiceSignal);
      socket.off("voice:renegotiate-request", handleRenegotiateRequest);
      socket.emit("voice:state", { micEnabled: false });
      closeAllPeerConnections();
      stopLocalStream();
    };
  }, [enabled, selfId, socket]);

  useEffect(() => {
    if (!enabled || !selfId) {
      return;
    }

    void syncDesiredPeers(candidatePeers.map((peer) => peer.id));
  }, [enabled, selfId, candidatePeers]);

  const connectionTargetCount = Math.max(peerSummaries.length, candidatePeers.length);
  const activeMicPeerCount =
    peerSummaries.filter((peer) => peer.micEnabled).length ||
    remoteStreams.filter((item) => (item.trackCount || 0) > 0).length;

  return {
    micEnabled,
    soundEnabled,
    peerSummaries,
    remoteStreams,
    voiceError,
    connectionTargetCount,
    activeMicPeerCount
  };
}
