import { MAP } from "./constants";

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
  localStorage.setItem("jungle-campus-session", JSON.stringify(session));
}

export function loadSession() {
  const raw = localStorage.getItem("jungle-campus-session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
