import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import AuthScreen from "./components/AuthScreen";
import ChatPanel from "./components/ChatPanel";
import HallCanvas from "./components/HallCanvas";
import { createRandomAvatar } from "./avatar";
import { MAP, SERVER_URL } from "./constants";
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
  const [chatInput, setChatInput] = useState("");
  const [chatScope, setChatScope] = useState("global");
  const [status, setStatus] = useState("로그인 후 입장하세요.");
  const movementRef = useRef({});
  const joinedRef = useRef(false);

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
      avatar: session.avatar || createRandomAvatar(),
      position: session.position || createSpawn()
    };

    socket.emit("player:join", payload, (response) => {
      if (!response?.ok) {
        setStatus(response?.message || "입장에 실패했습니다.");
        return;
      }

      joinedRef.current = true;
      saveSession({
        ...payload,
        position: response.player.position
      });
      setPlayers(response.users);
      setStatus(`${response.player.hall}에 입장했습니다.`);
    });

    const onHallState = (nextUsers) => setPlayers(nextUsers);
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

    socket.on("hall:state", onHallState);
    socket.on("player:joined", onPlayerJoined);
    socket.on("player:moved", onPlayerMoved);
    socket.on("player:left", onPlayerLeft);
    socket.on("player:status", onPlayerStatus);
    socket.on("chat:message", onChatMessage);

    return () => {
      socket.off("hall:state", onHallState);
      socket.off("player:joined", onPlayerJoined);
      socket.off("player:moved", onPlayerMoved);
      socket.off("player:left", onPlayerLeft);
      socket.off("player:status", onPlayerStatus);
      socket.off("chat:message", onChatMessage);
    };
  }, [session]);

  useEffect(() => {
    if (!self) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.target.tagName === "INPUT" || event.target.tagName === "SELECT") {
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
      avatar: createRandomAvatar(),
      position: createSpawn()
    };
    setSession(nextSession);
    saveSession(nextSession);
    setMessages([]);
  }

  function handleLogout() {
    joinedRef.current = false;
    localStorage.removeItem("jungle-campus-session");
    setPlayers([]);
    setMessages([]);
    setSession(null);
    setStatus("로그아웃되었습니다.");
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

  if (!session) {
    return <AuthScreen onSubmit={handleAuthSubmit} />;
  }

  return (
    <div className="shell shell-app">
      <header className="topbar">
        <div>
          <p className="eyebrow">KRAFTON JUNGLE</p>
          <h1>{session.hall}</h1>
        </div>
        <div className="topbar-meta">
          <span>{session.classroom}</span>
          <span>{players.length}명 접속 중</span>
          <button className="ghost-button" type="button" onClick={handleLogout}>나가기</button>
        </div>
      </header>
      <main className="layout">
        <section className="hall-panel">
          <div className="hall-toolbar">
            <p>{status}</p>
            <p>WASD 또는 방향키로 이동</p>
          </div>
          <HallCanvas players={players} />
        </section>
        <ChatPanel
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
