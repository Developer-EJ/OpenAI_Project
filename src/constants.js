export const HALLS = ["sw-ai랩", "게임랩", "게임 테크랩"];

export const AREA_ORDER = ["lobby", "basketball", "classroom", "cafeteria"];

export const AREA_META = {
  lobby: {
    id: "lobby",
    label: "메인 로비",
    description: "캠퍼스의 중심 허브입니다. 원하는 공간으로 이동해보세요.",
    accent: "#c29361"
  },
  basketball: {
    id: "basketball",
    label: "농구장",
    description: "팀원을 모아 가볍게 농구 파티를 만들어보세요.",
    accent: "#ce7f37"
  },
  classroom: {
    id: "classroom",
    label: "교육장",
    description: "스터디와 세션 참가자를 빠르게 모집할 수 있어요.",
    accent: "#5f8ab4"
  },
  cafeteria: {
    id: "cafeteria",
    label: "식당",
    description: "식사 메이트나 가벼운 잡담 파티를 만들기 좋은 공간입니다.",
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

export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "https://jungle-campus-production.up.railway.app";