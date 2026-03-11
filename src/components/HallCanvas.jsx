import { useEffect, useRef } from "react";
import jungleLogoUrl from "../assets/jungle-logo.webp";
import appleLogoUrl from "../assets/apple.png";
import basketballPortalUrl from "../assets/portal-basketball.jpg";
import cafeteriaPortalUrl from "../assets/portal-cafeteria.png";
import classroomPortalUrl from "../assets/portal-classroom-book.png";
import { createRandomAvatar } from "../avatar";
import { AREA_META, DEFAULT_AREA_ID, MAP } from "../constants";
import { AREAS, getAreaById } from "../data/areas";

let lobbyLogoImage = null;
let appleLogoImage = null;
const portalImages = {};
const processedPortalImages = {};
let processedAppleLogoImage = null;

function getLobbyLogoImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!lobbyLogoImage) {
    lobbyLogoImage = new Image();
    lobbyLogoImage.src = jungleLogoUrl;
  }

  return lobbyLogoImage;
}

function getAppleLogoImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!appleLogoImage) {
    appleLogoImage = new Image();
    appleLogoImage.src = appleLogoUrl;
  }

  return appleLogoImage;
}

function getProcessedAppleLogoImage() {
  if (typeof document === "undefined") {
    return null;
  }

  const sourceImage = getAppleLogoImage();
  if (!sourceImage?.complete) {
    return null;
  }

  if (processedAppleLogoImage) {
    return processedAppleLogoImage;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const average = (red + green + blue) / 3;
    const isNeutral =
      Math.abs(red - green) < 16 &&
      Math.abs(green - blue) < 16 &&
      Math.abs(red - blue) < 16;

    if (alpha > 0 && isNeutral && average > 185) {
      data[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
  processedAppleLogoImage = canvas;
  return canvas;
}

function getPortalImage(areaId) {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!portalImages[areaId]) {
    const image = new Image();
    image.src =
      areaId === "basketball"
        ? basketballPortalUrl
        : areaId === "cafeteria"
          ? cafeteriaPortalUrl
          : classroomPortalUrl;
    portalImages[areaId] = image;
  }

  return portalImages[areaId];
}

function getProcessedPortalImage(areaId) {
  if (typeof document === "undefined") {
    return null;
  }

  const sourceImage = getPortalImage(areaId);
  if (!sourceImage?.complete) {
    return null;
  }

  const cacheKey = `${areaId}:${sourceImage.width}x${sourceImage.height}`;
  if (processedPortalImages[cacheKey]) {
    return processedPortalImages[cacheKey];
  }

  const canvas = document.createElement("canvas");
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  const context = canvas.getContext("2d");
  context.drawImage(sourceImage, 0, 0);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const average = (red + green + blue) / 3;
    const isNeutral =
      Math.abs(red - green) < 18 &&
      Math.abs(green - blue) < 18 &&
      Math.abs(red - blue) < 18;

    if (alpha > 0 && isNeutral && average > 175) {
      data[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
  processedPortalImages[cacheKey] = canvas;
  return canvas;
}

function getPortalImageFrame(areaId, image) {
  if (!image?.width || !image?.height) {
    return { sx: 0, sy: 0, sw: 1, sh: 1 };
  }

  if (areaId === "basketball") {
    return {
      sx: image.width * 0.12,
      sy: image.height * 0.06,
      sw: image.width * 0.76,
      sh: image.height * 0.72
    };
  }

  return {
    sx: 0,
    sy: 0,
    sw: image.width,
    sh: image.height
  };
}

function getPortalImageScale(areaId) {
  if (areaId === "cafeteria") {
    return 0.9;
  }

  return 1;
}

function drawStyledPortal(ctx, area, isActive) {
  const { x, y, radius } = area.portal;
  const accent = AREA_META[area.id]?.accent || "#8a8a8a";
  const palette = getReturnDoorPalette(area.id);
  const doorWidth = radius * 1.18;
  const doorHeight = radius * 1.5;

  ctx.save();
  ctx.translate(x, y);

  if (isActive) {
    ctx.fillStyle =
      area.id === "basketball"
        ? "rgba(197, 109, 56, 0.12)"
        : area.id === "cafeteria"
          ? "rgba(127, 95, 75, 0.12)"
          : "rgba(97, 125, 139, 0.12)";
    ctx.beginPath();
    ctx.arc(0, 0, radius + 16, 0, Math.PI * 2);
    ctx.fill();
  }

  fillRounded(ctx, -doorWidth / 2, -doorHeight / 2, doorWidth, doorHeight, 20, palette.frame);
  strokeRounded(
    ctx,
    -doorWidth / 2,
    -doorHeight / 2,
    doorWidth,
    doorHeight,
    20,
    isActive ? accent : palette.frameStroke,
    isActive ? 4 : 3
  );
  fillRounded(
    ctx,
    -doorWidth / 2 + 10,
    -doorHeight / 2 + 12,
    doorWidth - 20,
    doorHeight - 24,
    16,
    palette.door
  );
  strokeRounded(
    ctx,
    -doorWidth / 2 + 10,
    -doorHeight / 2 + 12,
    doorWidth - 20,
    doorHeight - 24,
    16,
    palette.doorStroke,
    3
  );

  ctx.strokeStyle = palette.trim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -doorHeight / 2 + 18);
  ctx.lineTo(0, doorHeight / 2 - 18);
  ctx.stroke();

  ctx.fillStyle = palette.knob;
  ctx.beginPath();
  ctx.arc(doorWidth / 2 - 26, 2, 5, 0, Math.PI * 2);
  ctx.fill();

  if (area.id === "basketball") {
    ctx.fillStyle = "#dc7a3f";
    ctx.beginPath();
    ctx.arc(0, -6, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.detail;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -6, radius * 0.28, Math.PI * 0.18, Math.PI * 1.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.28, -6);
    ctx.lineTo(radius * 0.28, -6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.34);
    ctx.lineTo(0, radius * 0.22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.24, -radius * 0.18);
    ctx.quadraticCurveTo(-radius * 0.06, -radius * 0.04, -radius * 0.04, radius * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(radius * 0.24, -radius * 0.18);
    ctx.quadraticCurveTo(radius * 0.06, -radius * 0.04, radius * 0.04, radius * 0.2);
    ctx.stroke();
  } else if (area.id === "cafeteria") {
    ctx.fillStyle = "#fbf7f1";
    ctx.beginPath();
    ctx.arc(0, -2, radius * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.detail;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -2, radius * 0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.12, radius * 0.16);
    ctx.lineTo(radius * 0.12, radius * 0.16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-radius * 0.36, -radius * 0.22);
    ctx.lineTo(-radius * 0.36, radius * 0.16);
    ctx.stroke();
    [-0.42, -0.36, -0.3].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(radius * offset, -radius * 0.28);
      ctx.lineTo(radius * offset, -radius * 0.12);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.moveTo(radius * 0.32, -radius * 0.28);
    ctx.lineTo(radius * 0.26, radius * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(radius * 0.26, radius * 0.12);
    ctx.lineTo(radius * 0.32, radius * 0.2);
    ctx.stroke();
  } else {
    fillRounded(ctx, -radius * 0.34, -radius * 0.18, radius * 0.68, radius * 0.36, 10, palette.detail);
    fillRounded(ctx, -radius * 0.28, -radius * 0.12, radius * 0.56, radius * 0.24, 8, "#f9fbfc");
    fillRounded(ctx, -radius * 0.44, radius * 0.18, radius * 0.88, radius * 0.08, 8, palette.detail);
    ctx.fillStyle = palette.detail;
    ctx.font = `${Math.round(radius * 0.24)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(">_", 0, radius * 0.04);
  }

  ctx.fillStyle = palette.label;
  ctx.font = "700 18px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(AREA_META[area.id]?.label || area.id, 0, doorHeight / 2 + 26);

  ctx.restore();
}

function drawBasketballHoop(ctx, x, y, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);

  ctx.strokeStyle = "#f4efe7";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-58, -34);
  ctx.lineTo(0, -34);
  ctx.lineTo(0, 42);
  ctx.stroke();

  fillRounded(ctx, -82, -64, 24, 128, 12, "#516067");
  fillRounded(ctx, -58, -60, 18, 120, 9, "#d9e2e7");
  fillRounded(ctx, -18, -52, 26, 38, 8, "#f3f3f1");
  strokeRounded(ctx, -18, -52, 26, 38, 8, "#bcc6cc", 2);

  ctx.strokeStyle = "#d55d36";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(10, -10, 16, Math.PI * 0.15, Math.PI * 1.85);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    ctx.beginPath();
    ctx.moveTo(0, -2 + row * 9);
    ctx.lineTo(18, 4 + row * 9);
    ctx.stroke();
  }

  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRounded(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

function strokeRounded(ctx, x, y, width, height, radius, color, lineWidth = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  roundRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function getReturnDoorPalette(areaId) {
  if (areaId === "basketball") {
    return {
      frame: "#f1e5d6",
      frameStroke: "#c4986d",
      door: "#bf6d3d",
      doorStroke: "#f2c59a",
      trim: "rgba(255, 241, 225, 0.62)",
      knob: "#fff2dd",
      label: "#fff7ed"
    };
  }

  if (areaId === "cafeteria") {
    return {
      frame: "#f1ece4",
      frameStroke: "#b49478",
      door: "#7f5f4b",
      doorStroke: "#dbc4ab",
      trim: "rgba(255, 249, 241, 0.58)",
      knob: "#f7ead6",
      label: "#fff8ef"
    };
  }

  if (areaId === "classroom") {
    return {
      frame: "#eef2f3",
      frameStroke: "#9eafb8",
      door: "#6f8794",
      doorStroke: "#d6e2e7",
      trim: "rgba(247, 251, 252, 0.64)",
      knob: "#ffffff",
      label: "#f8fbfc"
    };
  }

  return {
    frame: "#efe6d5",
    frameStroke: "#b79a76",
    door: "#8d6748",
    doorStroke: "#d6bc95",
    trim: "rgba(255, 248, 239, 0.6)",
    knob: "#f7eddc",
    label: "#fff8ef"
  };
}

function drawReturnDoor(ctx, portal, areaId) {
  const width = portal.radius * 1.1;
  const height = portal.radius * 1.45;
  const palette = getReturnDoorPalette(areaId);

  ctx.save();
  ctx.translate(portal.x, portal.y);

  fillRounded(ctx, -width / 2, -height / 2, width, height, 18, palette.frame);
  strokeRounded(ctx, -width / 2, -height / 2, width, height, 18, palette.frameStroke, 4);
  fillRounded(ctx, -width / 2 + 10, -height / 2 + 12, width - 20, height - 24, 14, palette.door);
  strokeRounded(
    ctx,
    -width / 2 + 10,
    -height / 2 + 12,
    width - 20,
    height - 24,
    14,
    palette.doorStroke,
    3
  );

  ctx.strokeStyle = palette.trim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -height / 2 + 14);
  ctx.lineTo(0, height / 2 - 14);
  ctx.stroke();

  ctx.fillStyle = palette.knob;
  ctx.beginPath();
  ctx.arc(width / 2 - 24, 2, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.label;
  ctx.font = "700 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LOBBY", 0, height / 2 + 22);
  ctx.restore();
}

function drawAvatar(ctx, player) {
  const { x, y } = player.position;
  const avatar = player.avatar || createRandomAvatar(0.42);

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(18, 22, 21, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  fillRounded(ctx, -16, -2, 32, 28, 10, avatar.top);
  fillRounded(ctx, -7, 8, 14, 8, 4, avatar.accent);

  ctx.fillStyle = avatar.skin;
  ctx.beginPath();
  ctx.arc(0, -16, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = avatar.hair;
  ctx.beginPath();
  ctx.arc(0, -21, 17, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-17, -21, 34, 8);

  ctx.fillStyle = "#241711";
  ctx.beginPath();
  ctx.arc(-5, -17, 1.8, 0, Math.PI * 2);
  ctx.arc(5, -17, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#14211b";
  ctx.font = "600 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.name, 0, -44);

  ctx.fillStyle = "#f2f4ef";
  ctx.font = "12px sans-serif";
  ctx.fillText(player.classroom, 0, -58);

  if (player.lastMessage) {
    const bubbleWidth = Math.min(180, Math.max(90, player.lastMessage.length * 9));
    fillRounded(ctx, -bubbleWidth / 2, -102, bubbleWidth, 30, 12, "rgba(255, 255, 255, 0.94)");
    strokeRounded(ctx, -bubbleWidth / 2, -102, bubbleWidth, 30, 12, "rgba(28, 42, 34, 0.15)");
    ctx.fillStyle = "#23352b";
    ctx.font = "12px sans-serif";
    ctx.fillText(player.lastMessage.slice(0, 20), 0, -82);
  }

  ctx.restore();
}

function drawPortal(ctx, area, isActive) {
  drawStyledPortal(ctx, area, isActive);
}

function drawLobbyScene(ctx, previewAreaId) {
  ctx.clearRect(0, 0, MAP.width, MAP.height);
  ctx.fillStyle = "#d1d5d9";
  ctx.fillRect(0, 0, MAP.width, MAP.height);

  const logo = getLobbyLogoImage();
  if (logo?.complete) {
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.translate(MAP.width / 2, MAP.height / 2);
    ctx.drawImage(logo, -399, -112.2, 798, 224.4);
    ctx.restore();
  }

  AREAS.forEach((area) => drawPortal(ctx, area, area.id === previewAreaId));
}

function drawBasketballZones(ctx, currentShotZoneId, basketballGameActive) {
  BASKETBALL_SHOT_ZONES.forEach((zone) => {
    ctx.save();
    ctx.globalAlpha = currentShotZoneId === zone.id ? 0.28 : 0.18;
    ctx.fillStyle = zone.color;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = currentShotZoneId === zone.id ? "#ffffff" : zone.color;
    ctx.lineWidth = currentShotZoneId === zone.id ? 5 : 3;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#fff9ef";
    ctx.font = "700 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${zone.label} ${zone.points}점`, zone.x, zone.y + 6);
    ctx.restore();
  });

  ctx.save();
  ctx.fillStyle = basketballGameActive ? "#f68f3c" : "#f9c47a";
  ctx.beginPath();
  ctx.arc(1188, 462, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#7b3c16";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1172, 462);
  ctx.lineTo(1204, 462);
  ctx.moveTo(1188, 446);
  ctx.lineTo(1188, 478);
  ctx.stroke();

  ctx.strokeStyle = basketballGameActive ? "#ffffff" : "#ffe6c4";
  ctx.lineWidth = 6;
  ctx.strokeRect(1430, 420, 18, 120);
  ctx.strokeStyle = "#d14124";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(1400, 480);
  ctx.lineTo(1440, 480);
  ctx.stroke();
  ctx.fillStyle = "rgba(209, 65, 36, 0.2)";
  ctx.beginPath();
  ctx.ellipse(1420, 480, 28, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAreaScene(ctx, areaId) {
  ctx.clearRect(0, 0, MAP.width, MAP.height);

  if (areaId === "basketball") {
    ctx.fillStyle = "#965c33";
    ctx.fillRect(0, 0, MAP.width, MAP.height);
    fillRounded(ctx, 84, 84, MAP.width - 168, MAP.height - 168, 42, "#bf7b45");
    strokeRounded(ctx, 84, 84, MAP.width - 168, MAP.height - 168, 42, "#f6d4a9", 6);
    ctx.strokeStyle = "#f6d4a9";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(MAP.width / 2, 84);
    ctx.lineTo(MAP.width / 2, MAP.height - 84);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(MAP.width / 2, MAP.height / 2, 86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(84, 290, 132, 380);
    ctx.strokeRect(MAP.width - 216, 290, 132, 380);
    drawBasketballHoop(ctx, 142, MAP.height / 2, 1);
    drawBasketballHoop(ctx, MAP.width - 142, MAP.height / 2, -1);
  } else if (areaId === "cafeteria") {
    ctx.fillStyle = "#c7b7a6";
    ctx.fillRect(0, 0, MAP.width, MAP.height);
    fillRounded(ctx, 84, 84, MAP.width - 168, MAP.height - 168, 42, "#f4eadf");
    fillRounded(ctx, 126, 122, 360, 108, 24, "#eadfce");
    fillRounded(ctx, 1018, 124, 254, 112, 26, "#9a7256");
    fillRounded(ctx, 1298, 124, 178, 650, 28, "#ece5dc");
    fillRounded(ctx, 1316, 154, 142, 590, 24, "#d9ebe5");
    [
      [308, 368],
      [566, 368],
      [824, 368],
      [468, 604],
      [726, 604],
      [984, 604]
    ].forEach(([x, y], index) => {
      fillRounded(ctx, x, y, 144, 88, 24, index % 2 === 0 ? "#b58767" : "#a77757");
      fillRounded(ctx, x + 12, y + 12, 120, 26, 13, "#f6efe7");
      fillRounded(ctx, x + 18, y + 48, 30, 22, 10, "#dac9b9");
      fillRounded(ctx, x + 96, y + 48, 30, 22, 10, "#dac9b9");
    });
    fillRounded(ctx, 1046, 154, 198, 44, 18, "#7d5a43");
    fillRounded(ctx, 1080, 210, 134, 26, 13, "#d8b58c");
  } else {
    ctx.fillStyle = "#d4d0cb";
    ctx.fillRect(0, 0, MAP.width, MAP.height);
    fillRounded(ctx, 84, 84, MAP.width - 168, MAP.height - 168, 42, "#f7f6f3");
    fillRounded(ctx, 1228, 112, 214, 704, 28, "#e6eef0");
    fillRounded(ctx, 1246, 132, 178, 664, 20, "#d9eef5");
    fillRounded(ctx, 136, 142, 302, 92, 18, "#eef0f1");
    fillRounded(ctx, 516, 142, 268, 92, 18, "#eef0f1");
    fillRounded(ctx, 864, 142, 250, 92, 18, "#eef0f1");
    fillRounded(ctx, 236, 176, 150, 8, 4, "#bcc7cf");
    fillRounded(ctx, 610, 176, 84, 44, 10, "#1f2a33");
    const appleLogo = getProcessedAppleLogoImage() || getAppleLogoImage();
    if (appleLogo) {
      ctx.drawImage(appleLogo, 636, 182, 32, 32);
    }
    fillRounded(ctx, 950, 170, 78, 36, 8, "#ffffff");
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const x = 214 + column * 226;
        const y = 312 + row * 146;
        fillRounded(ctx, x, y, 152, 72, 18, "#e5e1db");
        strokeRounded(ctx, x, y, 152, 72, 18, "#c2bcb4", 2);
        fillRounded(ctx, x - 18, y + 18, 28, 28, 12, "#b9c1c6");
        fillRounded(ctx, x + 142, y + 18, 28, 28, 12, "#b9c1c6");
        fillRounded(ctx, x + 26, y + 16, 100, 18, 9, "#ffffff");
      }
    }
    fillRounded(ctx, 120, 250, 44, 466, 18, "#f1f1f1");
  }

  const area = getAreaById(areaId);
  if (area?.returnPortal) {
    drawReturnDoor(ctx, area.returnPortal, areaId);
  }
}

function getCanvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

export default function HallCanvas({
  currentArea,
  players,
  previewAreaId,
  onPortalSelect
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const resolvedAreaId =
      typeof currentArea === "string" && AREA_META[currentArea] ? currentArea : DEFAULT_AREA_ID;

    if (resolvedAreaId === DEFAULT_AREA_ID) {
      drawLobbyScene(ctx, previewAreaId);
    } else {
      drawAreaScene(ctx, resolvedAreaId);
    }

    players.forEach((player) => {
      if (player?.position && player?.name) {
        drawAvatar(ctx, player);
      }
    });
  }, [currentArea, players, previewAreaId]);

  function handleCanvasClick(event) {
    if (currentArea !== DEFAULT_AREA_ID) {
      return;
    }

    const canvas = canvasRef.current;
    const point = getCanvasPoint(canvas, event);
    const targetArea = AREAS.find((area) => {
      const dx = point.x - area.portal.x;
      const dy = point.y - area.portal.y;
      return Math.hypot(dx, dy) <= area.portal.radius + 18;
    });

    if (targetArea) {
      onPortalSelect(targetArea.id);
    }
  }

  return (
    <div className="canvas-shell">
      <canvas
        ref={canvasRef}
        width={MAP.width}
        height={MAP.height}
        onClick={handleCanvasClick}
      />
    </div>
  );
}
