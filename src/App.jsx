import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import AuthScreen from "./components/AuthScreen";
import BasketballPanel from "./components/BasketballPanel";
import ChatPanel from "./components/ChatPanel";
import HallCanvas from "./components/HallCanvas";
import PartyPanel from "./components/PartyPanel";
import { createRandomAvatar } from "./avatar";
import {
  findAreaByPosition,
  getAreaById,
  getBasketballShotZoneAtPosition,
  isInsidePortal
} from "./data/areas";
import {
  AREA_META,
  AREA_ORDER,
  DEFAULT_AREA_ID,
  MAP,
  PARTY_ENABLED_AREAS,
  SERVER_URL
} from "./constants";
import { clampPosition, loadSession, saveSession } from "./utils";

const socket = io(SERVER_URL, {
  autoConnect: false
});

const EMPTY_BASKETBALL_STATE = {
  active: false,
  remainingMs: 0,
  scoreboard: [],
  lastShot: null,
  zones: []
};

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
  const [status, setStatus] = useState("로그인 후 캠퍼스에 입장해보세요.");
  const [previewAreaId, setPreviewAreaId] = useState(null);
  const [partyPanelCollapsed, setPartyPanelCollapsed] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("party");
  const [basketballState, setBasketballState] = useState(EMPTY_BASKETBALL_STATE);
  const movementRef = useRef({});
  const joinedRef = useRef(false);

  const currentArea = session?.currentArea || DEFAULT_AREA_ID;
  const currentAreaMeta = AREA_META[currentArea] || AREA_META[DEFAULT_AREA_ID];

  const self = useMemo(
    () => players.find((player) => player.id === socket.id) || null,
    [players]
  );

  const nearbyArea = useMemo(
    () => (currentArea === DEFAULT_AREA_ID ? findAreaByPosition(self?.position) : null),
    [currentArea, self?.position]
  );

  const previewArea = useMemo(
    () => (currentArea === DEFAULT_AREA_ID ? getAreaById(previewAreaId) || nearbyArea : null),
    [currentArea, previewAreaId, nearbyArea]
  );

  const currentAreaConfig = useMemo(() => getAreaById(currentArea), [currentArea]);
  const currentShotZone = useMemo(
    () => (currentArea === "basketball" ? getBasketballShotZoneAtPosition(self?.position) : null),
    [currentArea, self?.position]
  );

  function resetSessionState(message) {
    joinedRef.current = false;
    localStorage.removeItem("jungle-campus-session");
    setPlayers([]);
    setMessages([]);
    setParties([]);
    setSession(null);
    setPartyMessage("");
    setPreviewAreaId(null);
    setBasketballState(EMPTY_BASKETBALL_STATE);
    setStatus(message);
  }

  useEffect(() => {
    if (currentArea !== DEFAULT_AREA_ID) {
      setPreviewAreaId(null);
      return;
    }

    setPreviewAreaId((current) => nearbyArea?.id || current);
  }, [currentArea, nearbyArea?.id]);

  useEffect(() => {
    if (!self) {
      return;
    }

    if (currentArea === DEFAULT_AREA_ID && nearbyArea) {
      handleAreaChange(nearbyArea.id);
      return;
    }

    if (
      currentArea !== DEFAULT_AREA_ID &&
      currentAreaConfig?.returnPortal &&
      isInsidePortal(self.position, currentAreaConfig.returnPortal)
    ) {
      handleAreaChange(DEFAULT_AREA_ID);
    }
  }, [self?.position, currentArea, nearbyArea?.id, currentAreaConfig?.returnPortal]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    socket.connect();

    function handleAreaState(payload) {
      if (payload?.areaId === currentArea) {
        setPlayers(payload.users || []);
      }
    }

    function handlePlayerJoined(player) {
      setPlayers((current) => {
        if (current.some((item) => item.id === player.id)) {
          return current.map((item) => (item.id === player.id ? player : item));
        }
        return [...current, player];
      });
    }

    function handlePlayerMoved(payload) {
      setPlayers((current) =>
        current.map((player) =>
          player.id === payload.id ? { ...player, position: payload.position } : player
        )
      );
    }

    function handlePlayerLeft(payload) {
      setPlayers((current) => current.filter((player) => player.id !== payload.id));
    }

    function handlePlayerStatus(payload) {
      setPlayers((current) =>
        current.map((player) =>
          player.id === payload.id ? { ...player, lastMessage: payload.lastMessage } : player
        )
      );
    }

    function handleChatMessage(payload) {
      setMessages((current) => [...current.slice(-59), payload]);
    }

    function handlePartyList(payload) {
      setParties(payload || []);
    }

    function handleAreaChanged(payload) {
      if (payload?.playerId === socket.id) {
        const nextSession = {
          ...session,
          currentArea: payload.areaId,
          position: payload.position || createSpawn()
        };
        setSession(nextSession);
        saveSession(nextSession);
      }
    }

    function handleBasketballState(payload) {
      setBasketballState(payload || EMPTY_BASKETBALL_STATE);
    }

    socket.on("area:state", handleAreaState);
    socket.on("player:joined", handlePlayerJoined);
    socket.on("player:moved", handlePlayerMoved);
    socket.on("player:left", handlePlayerLeft);
    socket.on("player:status", handlePlayerStatus);
    socket.on("chat:message", handleChatMessage);
    socket.on("party:list", handlePartyList);
    socket.on("area:changed", handleAreaChanged);
    socket.on("basketball:state", handleBasketballState);

    return () => {
      socket.off("area:state", handleAreaState);
      socket.off("player:joined", handlePlayerJoined);
      socket.off("player:moved", handlePlayerMoved);
      socket.off("player:left", handlePlayerLeft);
      socket.off("player:status", handlePlayerStatus);
      socket.off("chat:message", handleChatMessage);
      socket.off("party:list", handlePartyList);
      socket.off("area:changed", handleAreaChanged);
      socket.off("basketball:state", handleBasketballState);
    };
  }, [session, currentArea]);

  useEffect(() => {
    if (!session || joinedRef.current) {
      return;
    }

    socket.connect();
    socket.emit("player:join", session, (response) => {
      if (!response?.ok) {
        resetSessionState(response?.message || "입장에 실패했습니다.");
        return;
      }

      joinedRef.current = true;
      const nextSession = {
        ...session,
        currentArea: response.player.currentArea,
        position: response.player.position
      };
      setSession(nextSession);
      saveSession(nextSession);
      setPlayers(response.users || []);
      setParties(response.parties || []);
      setMessages([]);
      setStatus(response.message || "캠퍼스에 입장했습니다.");
      setBasketballState(response.basketball || EMPTY_BASKETBALL_STATE);
    });
  }, [session]);

  useEffect(() => {
    if (!self) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape" && currentArea !== DEFAULT_AREA_ID) {
        event.preventDefault();
        handleAreaChange(DEFAULT_AREA_ID);
        return;
      }

      if (event.code === "Space" && currentArea === "basketball") {
        event.preventDefault();
        handleBasketballShoot();
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
  }, [self, currentArea, currentShotZone, basketballState.active]);

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
    setPreviewAreaId(null);
    setBasketballState(EMPTY_BASKETBALL_STATE);
  }

  function handleLogout() {
    resetSessionState("로그아웃했습니다.");
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
        setPreviewAreaId(null);
        if (response.areaId !== "basketball") {
          setBasketballState(EMPTY_BASKETBALL_STATE);
        }
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
      setPartyMessage(response?.message || "파티 생성 요청을 보냈습니다.");
      if (response?.ok) {
        setPartyForm({ title: "", maxMembers: 4 });
      }
    });
  }

  function handlePartyJoin(partyId) {
    socket.emit("party:join", { partyId }, (response) => {
      setPartyMessage(response?.message || "파티 참가 요청을 보냈습니다.");
    });
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

  function handleBasketballStart() {
    socket.emit("basketball:start", (response) => {
      setStatus(response?.message || "농구 게임을 시작했습니다.");
    });
  }

  function handleBasketballShoot() {
    if (currentArea !== "basketball") {
      return;
    }

    socket.emit("basketball:shoot", (response) => {
      if (response?.message) {
        setStatus(response.message);
      }
    });
  }

  if (!session) {
    return <AuthScreen onSubmit={handleAuthSubmit} />;
  }

  return (
    <div className="shell shell-app">
      <header className="topbar">
        <div>
          <p className="eyebrow">{session.hall}</p>
          <h1>{currentAreaMeta.label}</h1>
        </div>
        <div className="topbar-meta">
          <span>{session.classroom}</span>
          <span>currentArea: {currentArea}</span>
          <span>{players.length}명 접속 중</span>
          <button className="ghost-button" type="button" onClick={handleLogout}>
            나가기
          </button>
        </div>
      </header>
      <main
        className={`layout layout-three-column${partyPanelCollapsed ? " is-party-collapsed" : ""}`}
      >
        <section className="hall-panel">
          <div className="hall-toolbar">
            <p>{status}</p>
            <p>
              {currentArea === "basketball"
                ? "슛 존에 들어가면 Space로 슛할 수 있습니다."
                : PARTY_ENABLED_AREAS.includes(currentArea)
                  ? "이 공간 전용 파티 보드를 사용할 수 있어요."
                  : previewArea
                    ? `${previewArea.koreanName}로 이동 중`
                    : "메인 로비에서 원하는 공간으로 이동해보세요."}
            </p>
          </div>
          {currentArea === "basketball" ? (
            <BasketballPanel
              gameState={basketballState}
              currentZone={currentShotZone}
              onStartGame={handleBasketballStart}
              onShoot={handleBasketballShoot}
              canStart={!basketballState.active}
              canShoot={basketballState.active && Boolean(currentShotZone)}
            />
          ) : null}
          <HallCanvas
            currentArea={currentArea}
            players={players}
            previewAreaId={previewArea?.id || null}
            onPortalSelect={handleAreaChange}
            currentShotZoneId={currentShotZone?.id || null}
            basketballGameActive={basketballState.active}
          />
          <div className="mobile-panel-switcher">
            <button
              type="button"
              className={`mobile-panel-chip${mobilePanel === "party" ? " is-active" : ""}`}
              onClick={() => setMobilePanel("party")}
            >
              파티
            </button>
            <button
              type="button"
              className={`mobile-panel-chip${mobilePanel === "chat" ? " is-active" : ""}`}
              onClick={() => setMobilePanel("chat")}
            >
              채팅
            </button>
          </div>
        </section>
        <div className={`mobile-panel-slot${mobilePanel === "party" ? " is-active" : ""}`}>
          <PartyPanel
            currentArea={currentArea}
            parties={parties}
            selfId={self?.id}
            collapsed={partyPanelCollapsed}
            createForm={partyForm}
            onCreateFormChange={handlePartyFormChange}
            onCreateParty={handlePartyCreate}
            onJoinParty={handlePartyJoin}
            onAreaChange={handleAreaChange}
            onToggleCollapsed={() => setPartyPanelCollapsed((current) => !current)}
            partyMessage={partyMessage}
            areaOrder={AREA_ORDER}
            areaMeta={AREA_META}
            defaultAreaId={DEFAULT_AREA_ID}
          />
        </div>
        <div className={`mobile-panel-slot${mobilePanel === "chat" ? " is-active" : ""}`}>
          <ChatPanel
            currentAreaLabel={currentAreaMeta.label}
            messages={messages}
            input={chatInput}
            scope={chatScope}
            onInputChange={setChatInput}
            onScopeChange={setChatScope}
            onSubmit={handleSendMessage}
          />
        </div>
      </main>
    </div>
  );
}
