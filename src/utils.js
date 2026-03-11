import { DEFAULT_AREA_ID, MAP } from "./constants";

const SESSION_STORAGE_KEY = "jungle-campus-session";
const SESSION_VERSION = 3;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clampPosition(position) {
  return {
    x: clamp(position.x, 56, MAP.width - 56),
    y: clamp(position.y, 72, MAP.height - 72)
  };
}

export function saveSession(session) {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      version: SESSION_VERSION,
      ...session
    })
  );
}

export function loadSession() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== SESSION_VERSION) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    if (
      typeof parsed?.name !== "string" ||
      typeof parsed?.classroom !== "string" ||
      typeof parsed?.hall !== "string"
    ) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return {
      currentArea: DEFAULT_AREA_ID,
      ...parsed
    };
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}
