const PALETTES = [
  { skin: "#f3d1b0", hair: "#4b2e1f", top: "#9f6f43", accent: "#ffe0a8" },
  { skin: "#e8b98e", hair: "#1b1f2a", top: "#5f7c65", accent: "#f3d8a0" },
  { skin: "#d59a73", hair: "#8a4f32", top: "#6f5b91", accent: "#ffd49f" },
  { skin: "#f1c5a6", hair: "#7a2030", top: "#3f6b83", accent: "#ffefb0" }
];

export const HAIR_COLOR_OPTIONS = [
  "#4b2e1f",
  "#1b1f2a",
  "#8a4f32",
  "#7a2030",
  "#5d503f",
  "#2e3b2f"
];

export const TOP_COLOR_OPTIONS = [
  { top: "#9f6f43", accent: "#ffe0a8" },
  { top: "#5f7c65", accent: "#f3d8a0" },
  { top: "#6f5b91", accent: "#ffd49f" },
  { top: "#3f6b83", accent: "#ffefb0" },
  { top: "#8f5a6a", accent: "#ffd9c4" },
  { top: "#56778c", accent: "#d2edf8" }
];

export function createRandomAvatar(seed = Math.random()) {
  const base = PALETTES[Math.floor(seed * PALETTES.length) % PALETTES.length];
  return {
    ...base,
    face: Math.floor(seed * 3),
    accessory: Math.floor(seed * 4)
  };
}

export function createAvatar(options = {}) {
  const base = createRandomAvatar(0.21);
  const topOption =
    TOP_COLOR_OPTIONS.find(
      (choice) => choice.top === options.top && choice.accent === options.accent
    ) || TOP_COLOR_OPTIONS[0];

  return {
    ...base,
    hair: options.hair || base.hair,
    top: topOption.top,
    accent: topOption.accent
  };
}
