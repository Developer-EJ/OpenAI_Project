import { useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

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

export function useAreaVoice({ socket, selfId, enabled }) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [peerSummaries, setPeerSummaries] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [voiceError, setVoiceError] = useState("");
  const connectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const pendingIceRef = useRef(new Map());

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

    entry.pc.onicecandidate = null;
    entry.pc.ontrack = null;
    entry.pc.onconnectionstatechange = null;
    entry.pc.close();
    connectionsRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
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
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
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

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const remoteStream = new MediaStream();
    const audioTransceiver = pc.addTransceiver("audio", { direction: "recvonly" });

    pc.ontrack = (event) => {
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
        return;
      }

      socket.emit("voice:signal", {
        targetId: peerId,
        signal: {
          type: "candidate",
          candidate: event.candidate
        }
      });
    };

    pc.onconnectionstatechange = () => {
      if (["closed", "failed", "disconnected"].includes(pc.connectionState)) {
        closePeerConnection(peerId);
      }
    };

    const next = { pc, remoteStream, audioTransceiver };
    connectionsRef.current.set(peerId, next);
    return next;
  }

  async function createOffer(peerId) {
    const entry = ensurePeerConnection(peerId);
    await syncLocalTrack(entry);
    const offer = await entry.pc.createOffer();
    await entry.pc.setLocalDescription(offer);
    socket.emit("voice:signal", {
      targetId: peerId,
      signal: {
        type: "description",
        description: entry.pc.localDescription
      }
    });
  }

  async function requestNegotiation(peerId) {
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

    if (nextMicEnabled) {
      try {
        await ensureLocalStream();
        setVoiceError("");
      } catch (error) {
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
      setPeerSummaries(nextPeers);

      const nextPeerIds = new Set(nextPeers.map((peer) => peer.id));
      Array.from(connectionsRef.current.keys()).forEach((peerId) => {
        if (!nextPeerIds.has(peerId)) {
          closePeerConnection(peerId);
        }
      });

      await Promise.all(
        nextPeers.map(async (peer) => {
          ensurePeerConnection(peer.id);
          if (shouldInitiateOffer(selfId, peer.id) && !connectionsRef.current.get(peer.id)?.pc.remoteDescription) {
            await createOffer(peer.id);
          }
        })
      );
    }

    async function handleVoiceSignal({ fromId, signal }) {
      if (!fromId || !signal) {
        return;
      }

      const entry = ensurePeerConnection(fromId);

      if (signal.type === "candidate") {
        if (entry.pc.remoteDescription) {
          await entry.pc.addIceCandidate(signal.candidate).catch(() => undefined);
        } else {
          const pending = pendingIceRef.current.get(fromId) || [];
          pending.push(signal.candidate);
          pendingIceRef.current.set(fromId, pending);
        }
        return;
      }

      if (signal.type !== "description") {
        return;
      }

      await syncLocalTrack(entry);
      await entry.pc.setRemoteDescription(signal.description);
      await flushPendingIce(fromId);

      if (signal.description.type === "offer") {
        const answer = await entry.pc.createAnswer();
        await entry.pc.setLocalDescription(answer);
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
      if (!fromId || !shouldInitiateOffer(selfId, fromId)) {
        return;
      }

      void createOffer(fromId);
    }

    window.addEventListener("keydown", handleKeyDown);
    socket.on("voice:peers", handleVoicePeers);
    socket.on("voice:signal", handleVoiceSignal);
    socket.on("voice:renegotiate-request", handleRenegotiateRequest);
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

  return {
    micEnabled,
    soundEnabled,
    peerSummaries,
    remoteStreams,
    voiceError
  };
}
