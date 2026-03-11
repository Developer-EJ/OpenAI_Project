import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import AuthScreen from "./components/AuthScreen";
import ChatPanel from "./components/ChatPanel";
import HallCanvas from "./components/HallCanvas";
import PartyPanel from "./components/PartyPanel";
import { createRandomAvatar } from "./avatar";
import {
  AREA_META,
  DEFAULT_AREA_ID,
  MAP,
  PARTY_ENABLED_AREAS,
  SERVER_URL
} from "./constants";
import { clampPosition, loadSession, saveSession } from "./utils";

const socket = io(SERVER_URL, {
  autoConnect: false
});

function createSpawn() {
  return {
    x: 180 + Math.floor(Math.random() * (MAP.width - 360)),
    y: 220 + Math.floor(Math.random() * (MAP.height - 420))
  };
}

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [parties, setParties] = useState([]);
  const [partyMessage, setPartyMessage] = useState("");
  const [partyForm, setPartyForm] = useState({ title: "", maxMembers: 4 });
  const [chatInput, setChatInput] = useState("");
  const [chatScope, setChatScope] = useState("global");
  const [status, setStatus] = useState("로그인 후 입장하세요.");
  const movementRef = useRef({});
  const joinedRef = useRef(false);

  const currentArea = session?.currentArea || DEFAULT_AREA_ID;
  const currentAreaMeta = AREA_META[currentArea] || AREA_META[DEFAULT_AREA_ID];

  const self = useMemo(
    () => players.find((player) => player.id === socket.id) || null,
    [players]
  );

  useEffect(() => {
    if (!session) {
      joinedRef.current = false;
      if (socket.connected) {
        socket.disconnect();
      }
      return undefined;
    }

    if (joinedRef.current) {
      return undefined;
    }

    if (!socket.connected) {
      socket.connect();
    }

    const payload = {
      ...session,
      currentArea: session.currentArea || DEFAULT_AREA_ID,
      avatar: session.avatar || createRandomAvatar(),
      position: session.position || createSpawn()
    };

    socket.emit("player:join", payload, (response) => {
      if (!response?.ok) {
        setStatus(response?.message || "입장에 실패했습니다.");
        return;
      }

      joinedRef.current = true;
      const nextSession = {
        ...payload,
        currentArea: response.player.currentArea,
        position: response.player.position
      };
      saveSession(nextSession);
      setSession(nextSession);
      setPlayers(response.users || []);
      setParties(response.parties || []);
      setMessages([]);
      setStatus(`${response.player.hall} · ${AREA_META[response.player.currentArea]?.label || currentAreaMeta.label}에 입장했습니다.`);
    });

    const onAreaState = ({ users: nextUsers }) => setPlayers(nextUsers);
    const onPlayerJoined = (player) => setStatus(`${player.name} 님이 입장했습니다.`);
    const onPlayerMoved = ({ id, position }) => {
      setPlayers((current) =>
        current.map((player) =>
          player.id === id ? { ...player, position } : player
        )
      );
    };
    const onPlayerLeft = ({ id }) => {
      setPlayers((current) => current.filter((player) => player.id !== id));
    };
    const onPlayerStatus = ({ id, lastMessage }) => {
      setPlayers((current) =>
        current.map((player) =>
          player.id === id ? { ...player, lastMessage } : player
        )
      );
    };
    const onChatMessage = (message) => {
      setMessages((current) => [...current.slice(-39), message]);
    };
    const onPartyList = (nextParties) => {
      setParties(nextParties);
    };
    const onAreaChanged = (response) => {
      setPlayers(response.users || []);
      setParties(response.parties || []);
      setMessages([]);
    };

    socket.on("area:state", onAreaState);
    socket.on("player:joined", onPlayerJoined);
    socket.on("player:moved", onPlayerMoved);
    socket.on("player:left", onPlayerLeft);
    socket.on("player:status", onPlayerStatus);
    socket.on("chat:message", onChatMessage);
    socket.on("party:list", onPartyList);
    socket.on("area:changed", onAreaChanged);

    return () => {
      socket.off("area:state", onAreaState);
      socket.off("player:joined", onPlayerJoined);
      socket.off("player:moved", onPlayerMoved);
      socket.off("player:left", onPlayerLeft);
      socket.off("player:status", onPlayerStatus);
      socket.off("chat:message", onChatMessage);
      socket.off("party:list", onPartyList);
      socket.off("area:changed", onAreaChanged);
    };
  }, [session, currentAreaMeta.label]);

  useEffect(() => {
    if (!self) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(event.target.tagName)) {
        return;
      }
      movementRef.current[event.key] = true;
    }

    function handleKeyUp(event) {
      movementRef.current[event.key] = false;
    }

    let animationFrameId;
    let lastTick = performance.now();

    const tick = (now) => {
      const delta = now - lastTick;
      lastTick = now;
      const speed = 0.2 * delta;
      let nextX = self.position.x;
      let nextY = self.position.y;

      if (movementRef.current.ArrowUp || movementRef.current.w) nextY -= speed;
      if (movementRef.current.ArrowDown || movementRef.current.s) nextY += speed;
      if (movementRef.current.ArrowLeft || movementRef.current.a) nextX -= speed;
      if (movementRef.current.ArrowRight || movementRef.current.d) nextX += speed;

      const nextPosition = clampPosition({ x: nextX, y: nextY });
      if (nextPosition.x !== self.position.x || nextPosition.y !== self.position.y) {
        setPlayers((current) =>
          current.map((player) =>
            player.id === self.id ? { ...player, position: nextPosition } : player
          )
        );
        socket.emit("player:move", nextPosition);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [self]);

  function handleAuthSubmit(form) {
    joinedRef.current = false;
    const nextSession = {
      ...form,
      currentArea: DEFAULT_AREA_ID,
      avatar: createRandomAvatar(),
      position: createSpawn()
    };
    setSession(nextSession);
    saveSession(nextSession);
    setMessages([]);
    setParties([]);
    setPartyMessage("");
  }

  function handleLogout() {
    joinedRef.current = false;
    localStorage.removeItem("jungle-campus-session");
    setPlayers([]);
    setMessages([]);
    setParties([]);
    setSession(null);
    setStatus("로그아웃되었습니다.");
    setPartyMessage("");
  }

  function handleSendMessage(event) {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || !self) {
      return;
    }
    socket.emit("chat:send", {
      message: trimmed,
      scope: chatScope
    });
    setChatInput("");
  }

  function handleAreaChange(areaId) {
    if (!session || areaId === currentArea) {
      return;
    }

    setPartyMessage("");
    socket.emit(
      "area:change",
      {
        areaId,
        position: createSpawn()
      },
      (response) => {
        if (!response?.ok) {
          setStatus(response?.message || "공간 이동에 실패했습니다.");
          return;
        }

        const nextSession = {
          ...session,
          currentArea: response.areaId,
          position: response.position || createSpawn()
        };
        setSession(nextSession);
        saveSession(nextSession);
        setPlayers(response.users || []);
        setParties(response.parties || []);
        setMessages([]);
        setStatus(`${AREA_META[response.areaId]?.label || response.areaId}로 이동했습니다.`);
      }
    );
  }

  function handlePartyFormChange(key, value) {
    setPartyForm((current) => ({ ...current, [key]: value }));
  }

  function handlePartyCreate(event) {
    event.preventDefault();
    socket.emit("party:create", partyForm, (response) => {
      setPartyMessage(response?.message || "파티 생성 요청이 완료되었습니다.");
      if (response?.ok) {
        setPartyForm({ title: "", maxMembers: 4 });
      }
    });
  }

  function handlePartyJoin(partyId) {
    socket.emit("party:join", { partyId }, (response) => {
      setPartyMessage(response?.message || "파티 참가 요청이 완료되었습니다.");
    });
  }

  if (!session) {
    return <AuthScreen onSubmit={handleAuthSubmit} />;
  }

  return (
    <div className="shell shell-app">
      <header className="topbar">
        <div>
          <p className="eyebrow">KRAFTON JUNGLE</p>
          <h1>{currentAreaMeta.label}</h1>
        </div>
        <div className="topbar-meta">
          <span>{session.hall}</span>
          <span>{session.classroom}</span>
          <span>{players.length}명 접속 중</span>
          <button className="ghost-button" type="button" onClick={handleLogout}>나가기</button>
        </div>
      </header>
      <main className="layout layout-three-column">
        <section className="hall-panel">
          <div className="hall-toolbar">
            <p>{status}</p>
            <p>
              {PARTY_ENABLED_AREAS.includes(currentArea)
                ? "이 공간 전용 파티 보드를 사용할 수 있어요."
                : "메인 로비에서 원하는 공간으로 이동해보세요."}
            </p>
          </div>
          <HallCanvas currentArea={currentArea} players={players} />
        </section>
        <PartyPanel
          currentArea={currentArea}
          parties={parties}
          selfId={self?.id}
          createForm={partyForm}
          onCreateFormChange={handlePartyFormChange}
          onCreateParty={handlePartyCreate}
          onJoinParty={handlePartyJoin}
          onAreaChange={handleAreaChange}
          partyMessage={partyMessage}
        />
        <ChatPanel
          currentAreaLabel={currentAreaMeta.label}
          messages={messages}
          input={chatInput}
          scope={chatScope}
          onInputChange={setChatInput}
          onScopeChange={setChatScope}
          onSubmit={handleSendMessage}
        />
      </main>
    </div>
  );
}