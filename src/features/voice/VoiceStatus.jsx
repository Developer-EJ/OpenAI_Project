import { useEffect, useRef } from "react";

function RemoteAudio({ stream, soundEnabled, trackCount }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.srcObject = stream;
  }, [stream, trackCount]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = !soundEnabled;
    audio.volume = 1;

    if (!soundEnabled) {
      audio.pause();
      return;
    }

    const tryPlay = () => {
      audio.play().catch(() => undefined);
    };

    tryPlay();
    stream?.addEventListener?.("addtrack", tryPlay);

    return () => {
      stream?.removeEventListener?.("addtrack", tryPlay);
    };
  }, [soundEnabled, stream, trackCount]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

export default function VoiceStatus({
  currentAreaLabel,
  micEnabled,
  soundEnabled,
  peerSummaries,
  remoteStreams,
  connectionTargetCount,
  activeMicPeerCount,
  voiceError
}) {
  const activeMicPeers = activeMicPeerCount ?? peerSummaries.filter((peer) => peer.micEnabled).length;
  const connectionTargets = connectionTargetCount ?? peerSummaries.length;

  return (
    <>
      <div className="voice-status-card">
        <p className="voice-status-title">Area Voice</p>
        <p>{currentAreaLabel} 안의 사용자끼리만 음성이 연결됩니다.</p>
        <p>마이크: {micEnabled ? "ON" : "OFF"} (M)</p>
        <p>수신: {soundEnabled ? "ON" : "OFF"} (V)</p>
        <p>같은 공간 연결 대상: {connectionTargets}명</p>
        <p>현재 송신 중인 인원: {activeMicPeers}명</p>
        {voiceError ? <p className="voice-status-error">{voiceError}</p> : null}
      </div>
      {remoteStreams.map((item) => (
        <RemoteAudio
          key={`${item.peerId}-${item.trackCount || 0}`}
          soundEnabled={soundEnabled}
          stream={item.stream}
          trackCount={item.trackCount || 0}
        />
      ))}
    </>
  );
}
