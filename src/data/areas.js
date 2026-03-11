export const LOBBY_AREA = {
  id: "lobby",
  name: "Main Lobby",
  koreanName: "로비",
  description: "포탈을 통해 각 AREA로 이동하는 메인 진입 공간"
};

export const AREA_ORDER = ["basketball", "cafeteria", "classroom"];

export const AREA_DEFINITIONS = {
  basketball: {
    id: "basketball",
    name: "Basketball Court",
    koreanName: "농구 코트",
    description: "팀 활동과 가벼운 네트워킹이 이어지는 액티브 AREA",
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
      spawn: { x: 164, y: 216 },
      landmarks: [
        { label: "Half Line", x: 164, y: 118 },
        { label: "Team Zone", x: 84, y: 66 },
        { label: "Bench", x: 244, y: 66 }
      ]
    },
    highlights: ["빠른 팀 매칭", "가벼운 잡담", "운동형 분위기"]
  },
  cafeteria: {
    id: "cafeteria",
    name: "Cafeteria",
    koreanName: "카페테리아",
    description: "자유 대화와 쉬는 시간을 위한 라운지형 AREA",
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
      spawn: { x: 92, y: 204 },
      landmarks: [
        { label: "Coffee Bar", x: 236, y: 58 },
        { label: "Lounge", x: 88, y: 106 },
        { label: "Window Seat", x: 250, y: 206 }
      ]
    },
    highlights: ["소규모 대화", "휴식 공간", "라운지 좌석"]
  },
  classroom: {
    id: "classroom",
    name: "Classroom",
    koreanName: "클래스룸",
    description: "스터디와 발표에 집중할 수 있는 학습형 AREA",
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
      spawn: { x: 166, y: 232 },
      landmarks: [
        { label: "Front Board", x: 166, y: 60 },
        { label: "Discussion Pods", x: 92, y: 148 },
        { label: "Materials", x: 252, y: 148 }
      ]
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
