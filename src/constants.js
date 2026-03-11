export const HALLS = ["sw-ai랩", "게임랩", "게임 테크랩"];

export const AREA_ORDER = ["lobby", "basketball", "classroom", "cafeteria"];

export const AREA_META = {
  lobby: {
    id: "lobby",
    label: "메인 로비",
    description: "캠퍼스의 중앙 허브입니다. 원하는 공간으로 이동해보세요.",
    accent: "#c29361"
  },
  basketball: {
    id: "basketball",
    label: "농구장",
    description: "농구 파티를 만들고 사람들을 빠르게 모을 수 있는 액티브 공간입니다.",
    accent: "#ce7f37"
  },
  classroom: {
    id: "classroom",
    label: "교육장",
    description: "스터디와 세션 참가자를 빠르게 모집할 수 있는 공간입니다.",
    accent: "#5f8ab4"
  },
  cafeteria: {
    id: "cafeteria",
    label: "식당",
    description: "식사 메이트나 가벼운 대화 파티를 만들기 좋은 공간입니다.",
    accent: "#6ba15b"
  }
};

export const PARTY_ENABLED_AREAS = AREA_ORDER.filter((areaId) => areaId !== "lobby");

export const DEFAULT_AREA_ID = "lobby";

export const MAP = {
  width: 1600,
  height: 960,
  tile: 64
};

const DEFAULT_REMOTE_SERVER_URL = "https://jungle-campus-production.up.railway.app";
const DEFAULT_STUN_URLS = ["stun:stun.l.google.com:19302"];

function getDefaultServerUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_REMOTE_SERVER_URL;
  }

  const { hostname } = window.location;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0";

  return isLocalHost ? "http://localhost:3001" : DEFAULT_REMOTE_SERVER_URL;
}

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || getDefaultServerUrl();

function parseIceUrls(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getIceServerConfig() {
  const stunUrls = parseIceUrls(import.meta.env.VITE_STUN_URLS);
  const turnUrls = parseIceUrls(import.meta.env.VITE_TURN_URLS);
  const turnUsername = String(import.meta.env.VITE_TURN_USERNAME || "").trim();
  const turnCredential = String(import.meta.env.VITE_TURN_CREDENTIAL || "").trim();

  const iceServers = [];

  iceServers.push({
    urls: stunUrls.length > 0 ? stunUrls : DEFAULT_STUN_URLS
  });

  if (turnUrls.length > 0 && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrls,
      username: turnUsername,
      credential: turnCredential
    });
  }

  return { iceServers };
}
