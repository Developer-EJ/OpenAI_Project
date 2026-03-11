export const LOBBY_AREA = {
  id: "lobby",
  name: "Main Lobby",
  koreanName: "로비",
  description: "네 개의 활동 공간으로 연결되는 메인 입구 공간"
};

export const AREA_ORDER = ["basketball", "cafeteria", "classroom"];

export const AREA_DEFINITIONS = {
  basketball: {
    id: "basketball",
    name: "Basketball Court",
    koreanName: "농구장",
    description: "빠른 이동과 팀 매칭이 어울리는 액티브 AREA",
    accent: "#d4773f",
    portal: {
      x: 268,
      y: 676,
      radius: 84,
      label: "COURT"
    },
    returnPortal: {
      x: 130,
      y: 130,
      radius: 72
    },
    preview: {
      spawn: { x: 164, y: 216 }
    },
    highlights: ["빠른 팀 매칭", "액티브 무드", "실시간 이동"]
  },
  cafeteria: {
    id: "cafeteria",
    name: "Cafeteria",
    koreanName: "식당",
    description: "자유로운 대화와 쉬는 시간을 위한 라운지형 AREA",
    accent: "#9c6b47",
    portal: {
      x: 1326,
      y: 236,
      radius: 84,
      label: "CAFE"
    },
    returnPortal: {
      x: 130,
      y: 130,
      radius: 72
    },
    preview: {
      spawn: { x: 92, y: 204 }
    },
    highlights: ["가벼운 대화", "휴식 공간", "라운지 좌석"]
  },
  classroom: {
    id: "classroom",
    name: "Classroom",
    koreanName: "교육장",
    description: "스터디와 발표를 집중해서 할 수 있는 학습형 AREA",
    accent: "#4f7b65",
    portal: {
      x: 1318,
      y: 676,
      radius: 84,
      label: "CLASS"
    },
    returnPortal: {
      x: 130,
      y: 130,
      radius: 72
    },
    preview: {
      spawn: { x: 166, y: 232 }
    },
    highlights: ["스터디 준비", "발표 공간", "집중형 좌석"]
  }
};

export const AREAS = AREA_ORDER.map((id) => AREA_DEFINITIONS[id]);
export const ALL_AREAS = [LOBBY_AREA, ...AREAS];

export function getAreaById(areaId) {
  if (!areaId) {
    return null;
  }

  if (areaId === LOBBY_AREA.id) {
    return LOBBY_AREA;
  }

  return AREA_DEFINITIONS[areaId] || null;
}

export function findAreaByPosition(position) {
  if (!position) {
    return null;
  }

  return (
    AREAS.find((area) => {
      const dx = position.x - area.portal.x;
      const dy = position.y - area.portal.y;
      return Math.hypot(dx, dy) <= area.portal.radius;
    }) || null
  );
}

export function isInsidePortal(position, portal) {
  if (!position || !portal) {
    return false;
  }

  const dx = position.x - portal.x;
  const dy = position.y - portal.y;
  return Math.hypot(dx, dy) <= portal.radius;
}
