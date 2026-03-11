import { useEffect, useRef } from "react";
import jungleLogoUrl from "../assets/jungle-logo.webp";
import appleLogoUrl from "../assets/apple.png";
import dotPortalUrl from "../assets/dot1.png";
import computerPortalUrl from "../assets/com.jpg";
import basketballDotUrl from "../assets/portal-basketball-dot.png";
import cafeteriaDotUrl from "../assets/portal-cafeteria-dot.png";
import cafeBurgerUrl from "../assets/cafe-burger.png";
import cafeSushiUrl from "../assets/cafe-sushi.png";
import { createRandomAvatar } from "../avatar";
import { AREA_META, DEFAULT_AREA_ID, MAP } from "../constants";
import { AREAS, BASKETBALL_SHOT_ZONES, getAreaById } from "../data/areas";

let lobbyLogoImage = null;
let appleLogoImage = null;
let dotPortalImage = null;
let computerPortalImage = null;
let basketballDotImage = null;
let cafeteriaDotImage = null;
let cafeBurgerImage = null;
let cafeSushiImage = null;
let processedAppleLogoImage = null;
let processedComputerPortalImage = null;

const DOT_PORTAL_FRAMES = {
  door: { sx: 244, sy: 272, sw: 280, sh: 444 },
  basketball: { sx: 655, sy: 305, sw: 272, sh: 272 },
  cafeteria: { sx: 996, sy: 290, sw: 354, sh: 286 }
};

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

function getDotPortalImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!dotPortalImage) {
    dotPortalImage = new Image();
    dotPortalImage.src = dotPortalUrl;
  }

  return dotPortalImage;
}

function getComputerPortalImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!computerPortalImage) {
    computerPortalImage = new Image();
    computerPortalImage.src = computerPortalUrl;
  }

  return computerPortalImage;
}

function getBasketballDotImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!basketballDotImage) {
    basketballDotImage = new Image();
    basketballDotImage.src = basketballDotUrl;
  }

  return basketballDotImage;
}

function getCafeteriaDotImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!cafeteriaDotImage) {
    cafeteriaDotImage = new Image();
    cafeteriaDotImage.src = cafeteriaDotUrl;
  }

  return cafeteriaDotImage;
}

function getCafeBurgerImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!cafeBurgerImage) {
    cafeBurgerImage = new Image();
    cafeBurgerImage.src = cafeBurgerUrl;
  }

  return cafeBurgerImage;
}

function getCafeSushiImage() {
  if (typeof Image === "undefined") {
    return null;
  }

  if (!cafeSushiImage) {
    cafeSushiImage = new Image();
    cafeSushiImage.src = cafeSushiUrl;
  }

  return cafeSushiImage;
}

function drawPixelatedImage(ctx, image, dx, dy, dw, dh, sampleWidth = 64, sampleHeight = 64) {
  if (typeof document === "undefined" || !image) {
    return;
  }

  const pixelCanvas = document.createElement("canvas");
  pixelCanvas.width = sampleWidth;
  pixelCanvas.height = sampleHeight;
  const pixelContext = pixelCanvas.getContext("2d");
  pixelContext.imageSmoothingEnabled = false;
  pixelContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(pixelCanvas, dx, dy, dw, dh);
  ctx.restore();
}

function getProcessedComputerPortalImage() {
  if (typeof document === "undefined") {
    return null;
  }

  const sourceImage = getComputerPortalImage();
  if (!sourceImage?.complete) {
    return null;
  }

  if (processedComputerPortalImage) {
    return processedComputerPortalImage;
  }

  const frame = {
    sx: 188,
    sy: 124,
    sw: 620,
    sh: 760
  };

  const canvas = document.createElement("canvas");
  canvas.width = frame.sw;
  canvas.height = frame.sh;
  const context = canvas.getContext("2d");
  context.drawImage(
    sourceImage,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    0,
    0,
    frame.sw,
    frame.sh
  );

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;
  const bgRed = data[0];
  const bgGreen = data[1];
  const bgBlue = data[2];

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const closeToBackground =
      Math.abs(red - bgRed) < 24 &&
      Math.abs(green - bgGreen) < 24 &&
      Math.abs(blue - bgBlue) < 24;
    const watermarkLike = red > 220 && green > 220 && blue > 220;

    if (alpha > 0 && (closeToBackground || watermarkLike)) {
      data[index + 3] = 0;
    }
  }

  context.putImageData(imageData, 0, 0);
  processedComputerPortalImage = canvas;
  return canvas;
}

function drawStyledPortal(ctx, area, isActive) {
  const { x, y, radius } = area.portal;
  const accent = AREA_META[area.id]?.accent || "#8a8a8a";
  const doorWidth = 76;
  const doorHeight = 115;
  const labelY = doorHeight / 2 + 29;
  const iconCenterX = x < MAP.width / 2 ? 54 : -54;
  const unit = 4;

  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;

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

  fillPixelRect(ctx, -doorWidth / 2, -doorHeight / 2, doorWidth, doorHeight, "#1f2430");
  fillPixelRect(ctx, -doorWidth / 2 + unit, -doorHeight / 2 + unit, doorWidth - unit * 2, doorHeight - unit * 2, "#7e4f2c");
  fillPixelRect(ctx, -doorWidth / 2 + unit * 2, -doorHeight / 2 + unit * 2, doorWidth - unit * 4, doorHeight - unit * 4, "#9d6234");
  fillPixelRect(ctx, -doorWidth / 2 + unit * 4, -doorHeight / 2 + unit * 4, doorWidth - unit * 8, doorHeight - unit * 8, "#7c451f");
  fillPixelRect(ctx, -doorWidth / 2 + 12, -doorHeight / 2 + 12, 8, doorHeight - 24, "#b56d36");
  fillPixelRect(ctx, -doorWidth / 2 + 28, -doorHeight / 2 + 20, 8, doorHeight - 40, "#b56d36");
  fillPixelRect(ctx, doorWidth / 2 - 20, -4, 8, 8, "#ffd35a");
  if (isActive) {
    fillPixelRect(ctx, -doorWidth / 2 - 4, -doorHeight / 2 - 4, doorWidth + 8, 4, accent);
    fillPixelRect(ctx, -doorWidth / 2 - 4, doorHeight / 2, doorWidth + 8, 4, accent);
    fillPixelRect(ctx, -doorWidth / 2 - 4, -doorHeight / 2, 4, doorHeight, accent);
    fillPixelRect(ctx, doorWidth / 2, -doorHeight / 2, 4, doorHeight, accent);
  }

  if (area.id === "basketball") {
    fillPixelRect(ctx, iconCenterX - 16, labelY - 20, 32, 32, "#e77a22");
    fillPixelRect(ctx, iconCenterX - 12, labelY - 16, 24, 24, "#ff962f");
    fillPixelRect(ctx, iconCenterX - 2, labelY - 20, 4, 32, "#1b2030");
    fillPixelRect(ctx, iconCenterX - 16, labelY - 2, 32, 4, "#1b2030");
    fillPixelRect(ctx, iconCenterX - 14, labelY - 14, 4, 8, "#1b2030");
    fillPixelRect(ctx, iconCenterX + 10, labelY + 6, 4, 8, "#1b2030");
  } else if (area.id === "cafeteria") {
    fillPixelRect(ctx, iconCenterX - 16, labelY - 6, 32, 4, "#6f5238");
    fillPixelRect(ctx, iconCenterX - 16, labelY + 4, 32, 4, "#6f5238");
    fillPixelRect(ctx, iconCenterX - 10, labelY - 18, 20, 4, "#f2f0e8");
    fillPixelRect(ctx, iconCenterX - 12, labelY - 14, 24, 8, "#f2f0e8");
    fillPixelRect(ctx, iconCenterX - 10, labelY - 6, 20, 4, "#d7b084");
    fillPixelRect(ctx, iconCenterX - 12, labelY - 2, 24, 8, "#b7895b");
    fillPixelRect(ctx, iconCenterX - 8, labelY + 6, 16, 4, "#8e623d");
    sprinklePixels(ctx, "#d9d6cf", [
      [iconCenterX - 6, labelY - 20, 2],
      [iconCenterX + 2, labelY - 16, 2],
      [iconCenterX - 2, labelY - 12, 2]
    ]);
  } else {
    fillPixelRect(ctx, iconCenterX - 18, labelY - 20, 36, 24, "#1f2430");
    fillPixelRect(ctx, iconCenterX - 14, labelY - 16, 28, 16, "#dce7ea");
    fillPixelRect(ctx, iconCenterX - 6, labelY + 4, 12, 4, "#1f2430");
    fillPixelRect(ctx, iconCenterX - 18, labelY + 8, 36, 4, "#1f2430");
    fillPixelRect(ctx, iconCenterX - 8, labelY - 10, 4, 4, "#1f2430");
    fillPixelRect(ctx, iconCenterX + 0, labelY - 10, 8, 4, "#1f2430");
  }

  ctx.fillStyle = accent;
  ctx.font = "800 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(AREA_META[area.id]?.label || area.id, 0, labelY);

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
  const width = 76;
  const height = 115;
  const palette = getReturnDoorPalette(areaId);
  const unit = 4;

  ctx.save();
  ctx.translate(portal.x, portal.y);
  ctx.imageSmoothingEnabled = false;

  fillPixelRect(ctx, -width / 2, -height / 2, width, height, "#1f2430");
  fillPixelRect(ctx, -width / 2 + unit, -height / 2 + unit, width - unit * 2, height - unit * 2, palette.door);
  fillPixelRect(ctx, -width / 2 + unit * 2, -height / 2 + unit * 2, width - unit * 4, height - unit * 4, palette.frameStroke);
  fillPixelRect(ctx, -width / 2 + unit * 4, -height / 2 + unit * 4, width - unit * 8, height - unit * 8, palette.door);
  fillPixelRect(ctx, -width / 2 + 12, -height / 2 + 12, 8, height - 24, palette.doorStroke);
  fillPixelRect(ctx, -width / 2 + 28, -height / 2 + 20, 8, height - 40, palette.doorStroke);
  fillPixelRect(ctx, width / 2 - 20, -4, 8, 8, palette.knob);

  ctx.fillStyle = palette.label;
  ctx.font = "700 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("LOBBY", 0, height / 2 + 22);
  ctx.restore();
}

function fillPixelRect(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function sprinklePixels(ctx, color, points) {
  ctx.fillStyle = color;
  points.forEach(([x, y, size = 4]) => {
    ctx.fillRect(x, y, size, size);
  });
}

function drawPixelAvatarSprite(ctx, avatar, motion = {}) {
  const unit = 4;
  const offsetX = -18;
  const offsetY = -44 + (motion.bodyOffsetY || 0);
  const leftLegOffset = motion.leftLegOffset || 0;
  const rightLegOffset = motion.rightLegOffset || 0;

  const draw = (gx, gy, gw, gh, color) => {
    fillPixelRect(ctx, offsetX + gx * unit, offsetY + gy * unit, gw * unit, gh * unit, color);
  };

  draw(2, 0, 5, 1, avatar.hair);
  draw(1, 1, 7, 1, avatar.hair);
  draw(1, 2, 1, 1, avatar.hair);
  draw(7, 2, 1, 1, avatar.hair);

  draw(2, 2, 5, 3, avatar.skin);
  draw(1, 3, 1, 1, avatar.skin);
  draw(7, 3, 1, 1, avatar.skin);
  draw(3, 5, 3, 1, avatar.skin);

  draw(3, 3, 1, 1, "#241711");
  draw(5, 3, 1, 1, "#241711");

  draw(2, 6, 5, 1, avatar.top);
  draw(1, 7, 7, 2, avatar.top);
  draw(2, 9, 5, 1, avatar.top);
  draw(3, 7, 3, 1, avatar.accent);

  draw(1, 9, 1, 2, avatar.skin);
  draw(7, 9, 1, 2, avatar.skin);
  fillPixelRect(ctx, offsetX + 2 * unit, offsetY + (10 + leftLegOffset) * unit, 2 * unit, 3 * unit, "#2b3430");
  fillPixelRect(
    ctx,
    offsetX + 5 * unit,
    offsetY + (10 + rightLegOffset) * unit,
    2 * unit,
    3 * unit,
    "#2b3430"
  );

  fillPixelRect(ctx, offsetX + 1 * unit, offsetY + (13 + leftLegOffset) * unit, 2 * unit, 1 * unit, "#1c241f");
  fillPixelRect(
    ctx,
    offsetX + 5 * unit,
    offsetY + (13 + rightLegOffset) * unit,
    2 * unit,
    1 * unit,
    "#1c241f"
  );
}

function drawAvatar(ctx, player) {
  const { x, y } = player.position;
  const avatar = player.avatar || createRandomAvatar(0.42);
  const stridePhase = (x + y) / 14;
  const leftLegOffset = player.isMoving ? Math.round(Math.sin(stridePhase)) : 0;
  const rightLegOffset = player.isMoving ? Math.round(Math.sin(stridePhase + Math.PI)) : 0;
  const bodyOffsetY = player.isMoving ? Math.round(Math.cos(stridePhase * 2) * 0.5) : 0;
  const avatarScale = 1.1;

  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "rgba(18, 22, 21, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 22, player.isMoving ? 20 : 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.scale(avatarScale, avatarScale);
  drawPixelAvatarSprite(ctx, avatar, {
    bodyOffsetY,
    leftLegOffset,
    rightLegOffset
  });
  ctx.restore();

  ctx.fillStyle = "#14211b";
  ctx.font = "700 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.name, 0, -58);

  ctx.fillStyle = "#f2f4ef";
  ctx.font = "12px sans-serif";
  ctx.fillText(player.classroom, 0, -74);

  if (player.lastMessage) {
    const bubbleWidth = Math.min(196, Math.max(102, player.lastMessage.length * 9));
    fillRounded(ctx, -bubbleWidth / 2, -114, bubbleWidth, 34, 12, "rgba(255, 255, 255, 0.94)");
    strokeRounded(ctx, -bubbleWidth / 2, -114, bubbleWidth, 34, 12, "rgba(28, 42, 34, 0.15)");
    ctx.fillStyle = "#23352b";
    ctx.font = "12px sans-serif";
    ctx.fillText(player.lastMessage.slice(0, 20), 0, -92);
  }

  ctx.restore();
}

function drawPortal(ctx, area, isActive) {
  drawStyledPortal(ctx, area, isActive);
}

function drawLobbyScene(ctx, previewAreaId) {
  ctx.clearRect(0, 0, MAP.width, MAP.height);
  ctx.imageSmoothingEnabled = false;
  const tile = 16;
  const border = 5 * tile;
  const innerX = border;
  const innerY = border;
  const innerWidth = MAP.width - border * 2;
  const innerHeight = MAP.height - border * 2;

  ctx.fillStyle = "#515861";
  ctx.fillRect(0, 0, MAP.width, MAP.height);

  for (let y = 0; y < MAP.height; y += tile) {
    for (let x = 0; x < MAP.width; x += tile) {
      const isBorder =
        x < innerX || x >= innerX + innerWidth || y < innerY || y >= innerY + innerHeight;
      if (isBorder) {
        const wallTone = ((x / tile) + (y / tile)) % 2 === 0 ? "#6c737c" : "#5d646d";
        fillPixelRect(ctx, x, y, tile, tile, wallTone);
        fillPixelRect(ctx, x, y, tile, 2, "#8e97a1");
        fillPixelRect(ctx, x, y + tile - 2, tile, 2, "#3f454d");
      } else {
        const floorTone = ((x / tile) + (y / tile)) % 2 === 0 ? "#cfd5da" : "#c3c9ce";
        fillPixelRect(ctx, x, y, tile, tile, floorTone);
        fillPixelRect(ctx, x, y, tile, 1, "#dde2e6");
        fillPixelRect(ctx, x, y + tile - 1, tile, 1, "#aab1b7");
      }
    }
  }

  const drawPillar = (x, y) => {
    fillPixelRect(ctx, x, y, tile * 2, tile * 2, "#8b949d");
    fillPixelRect(ctx, x + 2, y + 2, tile * 2 - 4, tile * 2 - 4, "#b6bec6");
    fillPixelRect(ctx, x + 5, y + 5, tile * 2 - 10, tile * 2 - 10, "#d8dde1");
  };

  [
    [170, 140], [MAP.width - 202, 140],
    [170, MAP.height - 172], [MAP.width - 202, MAP.height - 172]
  ].forEach(([x, y]) => drawPillar(x, y));

  const drawBench = (x, y, width) => {
    fillPixelRect(ctx, x, y, width, 10, "#8e623d");
    fillPixelRect(ctx, x, y + 10, width, 4, "#5a3b26");
    fillPixelRect(ctx, x + 8, y + 14, 6, 14, "#4c3321");
    fillPixelRect(ctx, x + width - 14, y + 14, 6, 14, "#4c3321");
  };

  drawBench(238, 144, 118);
  drawBench(MAP.width - 356, 144, 118);
  drawBench(238, MAP.height - 166, 118);
  drawBench(MAP.width - 356, MAP.height - 166, 118);

  const drawPlanter = (x, y) => {
    fillPixelRect(ctx, x, y, 48, 20, "#7d5738");
    fillPixelRect(ctx, x + 3, y + 3, 42, 14, "#5a3e2a");
    fillPixelRect(ctx, x + 8, y - 8, 10, 10, "#58a14d");
    fillPixelRect(ctx, x + 18, y - 14, 12, 12, "#6dc560");
    fillPixelRect(ctx, x + 28, y - 8, 10, 10, "#58a14d");
  };

  [420, 542, 964, 1086].forEach((x) => drawPlanter(x, 162));
  [420, 542, 964, 1086].forEach((x) => drawPlanter(x, MAP.height - 138));

  sprinklePixels(ctx, "#eef2f5", [
    [304, 240, 3], [544, 224, 3], [820, 208, 3], [1168, 240, 3],
    [330, 704, 3], [612, 736, 3], [930, 716, 3], [1218, 700, 3]
  ]);
  sprinklePixels(ctx, "#aeb5bb", [
    [286, 272, 3], [570, 264, 3], [852, 244, 3], [1148, 274, 3],
    [350, 684, 3], [636, 710, 3], [952, 694, 3], [1230, 676, 3]
  ]);

  const logo = getLobbyLogoImage();
  if (logo?.complete) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    drawPixelatedImage(ctx, logo, MAP.width / 2 - 336, MAP.height / 2 - 92, 672, 184, 96, 28);
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

function drawAreaScene(ctx, areaId, currentShotZoneId, basketballGameActive) {
  ctx.clearRect(0, 0, MAP.width, MAP.height);
  ctx.imageSmoothingEnabled = false;
  const tile = 16;

  if (areaId === "basketball") {
    for (let y = 0; y < MAP.height; y += tile) {
      for (let x = 0; x < MAP.width; x += tile) {
        const tone = ((x / tile) + (y / tile)) % 2 === 0 ? "#6f873d" : "#627936";
        fillPixelRect(ctx, x, y, tile, tile, tone);
      }
    }

    const courtX = 180;
    const courtY = 104;
    const courtWidth = MAP.width - 360;
    const courtHeight = MAP.height - 208;

    fillPixelRect(ctx, courtX - 16, courtY - 16, courtWidth + 32, courtHeight + 32, "#8a9a5b");
    fillPixelRect(ctx, courtX, courtY, courtWidth, courtHeight, "#b5451f");

    for (let y = courtY; y < courtY + courtHeight; y += tile) {
      for (let x = courtX; x < courtX + courtWidth; x += tile) {
        const tone = ((x / tile) + (y / tile)) % 2 === 0 ? "#bc4d24" : "#a83f1b";
        fillPixelRect(ctx, x, y, tile, tile, tone);
      }
    }

    fillPixelRect(ctx, courtX, courtY, courtWidth, 6, "#e7d8c8");
    fillPixelRect(ctx, courtX, courtY + courtHeight - 6, courtWidth, 6, "#e7d8c8");
    fillPixelRect(ctx, courtX, courtY, 6, courtHeight, "#e7d8c8");
    fillPixelRect(ctx, courtX + courtWidth - 6, courtY, 6, courtHeight, "#e7d8c8");
    fillPixelRect(ctx, MAP.width / 2 - 3, courtY, 6, courtHeight, "#e7d8c8");

    fillPixelRect(ctx, courtX + 92, MAP.height / 2 - 3, 120, 6, "#e7d8c8");
    fillPixelRect(ctx, courtX + courtWidth - 212, MAP.height / 2 - 3, 120, 6, "#e7d8c8");
    fillPixelRect(ctx, MAP.width / 2 - 40, MAP.height / 2 - 40, 80, 80, "#bc4d24");
    fillPixelRect(ctx, MAP.width / 2 - 3, MAP.height / 2 - 40, 6, 80, "#e7d8c8");
    fillPixelRect(ctx, MAP.width / 2 - 40, MAP.height / 2 - 3, 80, 6, "#e7d8c8");

    fillPixelRect(ctx, courtX + 80, MAP.height / 2 - 112, 92, 224, "#bf5b34");
    fillPixelRect(ctx, courtX + courtWidth - 172, MAP.height / 2 - 112, 92, 224, "#bf5b34");
    fillPixelRect(ctx, courtX + 80, MAP.height / 2 - 112, 6, 224, "#e7d8c8");
    fillPixelRect(ctx, courtX + 80, MAP.height / 2 - 112, 92, 6, "#e7d8c8");
    fillPixelRect(ctx, courtX + 80, MAP.height / 2 + 106, 92, 6, "#e7d8c8");
    fillPixelRect(ctx, courtX + courtWidth - 86, MAP.height / 2 - 112, 6, 224, "#e7d8c8");
    fillPixelRect(ctx, courtX + courtWidth - 172, MAP.height / 2 - 112, 92, 6, "#e7d8c8");
    fillPixelRect(ctx, courtX + courtWidth - 172, MAP.height / 2 + 106, 92, 6, "#e7d8c8");

    for (let x = courtX + 24; x < courtX + courtWidth; x += 64) {
      fillPixelRect(ctx, x, courtY - 22, 4, 18, "#2e321f");
      fillPixelRect(ctx, x + 20, courtY - 22, 4, 18, "#2e321f");
      fillPixelRect(ctx, x, courtY + courtHeight + 4, 4, 18, "#2e321f");
      fillPixelRect(ctx, x + 20, courtY + courtHeight + 4, 4, 18, "#2e321f");
    }

    sprinklePixels(ctx, "#7d963f", [
      [74, 132, 4], [126, 208, 4], [84, 760, 4], [1460, 190, 4], [1502, 280, 4],
      [1454, 744, 4], [260, 74, 4], [1228, 74, 4]
    ]);
    sprinklePixels(ctx, "#d36a39", [
      [264, 180, 4], [416, 212, 4], [1184, 226, 4], [352, 680, 4], [1068, 710, 4]
    ]);
    drawBasketballZones(ctx, currentShotZoneId, basketballGameActive);
  } else if (areaId === "cafeteria") {
    for (let y = 0; y < MAP.height; y += tile) {
      for (let x = 0; x < MAP.width; x += tile) {
        const tone = ((x / tile) + (y / tile)) % 2 === 0 ? "#efe2d3" : "#e4d4c3";
        fillPixelRect(ctx, x, y, tile, tile, tone);
      }
    }
    fillPixelRect(ctx, 96, 96, MAP.width - 192, 16, "#d3c3b2");
    fillPixelRect(ctx, 96, MAP.height - 112, MAP.width - 192, 16, "#c0b09f");
    fillPixelRect(ctx, 96, 96, 16, MAP.height - 192, "#d8c8b8");
    fillPixelRect(ctx, MAP.width - 112, 96, 16, MAP.height - 192, "#c2b3a3");
    fillPixelRect(ctx, 1280, 112, 192, 672, "#e5dfd5");
    fillPixelRect(ctx, 1296, 128, 160, 624, "#cfe6df");
    fillPixelRect(ctx, 112, 120, 384, 96, "#dfd0bf");
    fillPixelRect(ctx, 1008, 120, 272, 112, "#866047");
    fillPixelRect(ctx, 1040, 152, 208, 24, "#d1b08a");
    [
      [308, 368],
      [566, 368],
      [824, 368],
      [468, 604],
      [726, 604],
      [984, 604]
    ].forEach(([x, y], index) => {
      fillPixelRect(ctx, x, y, 144, 88, index % 2 === 0 ? "#8e623d" : "#7c5332");
      fillPixelRect(ctx, x, y, 144, 6, "#d6b089");
      fillPixelRect(ctx, x, y + 82, 144, 6, "#5e3e26");
      fillPixelRect(ctx, x + 14, y + 18, 24, 52, "#70513b");
      fillPixelRect(ctx, x + 106, y + 18, 24, 52, "#70513b");
      fillPixelRect(ctx, x + 44, y + 20, 56, 36, "#f0eadc");
      fillPixelRect(ctx, x + 52, y + 58, 12, 18, "#b7a08a");
      fillPixelRect(ctx, x + 80, y + 58, 12, 18, "#b7a08a");

      const foodIcon = index % 2 === 0 ? getCafeBurgerImage() : getCafeSushiImage();
      if (foodIcon?.complete) {
        drawPixelatedImage(ctx, foodIcon, x + 54, y + 24, 34, 34, 12, 12);
      }
    });
    for (let x = 140; x < 1200; x += 96) {
      fillPixelRect(ctx, x, 250, 12, 12, "#d9cab9");
      fillPixelRect(ctx, x + 26, 250, 12, 12, "#d9cab9");
      fillPixelRect(ctx, x + 52, 250, 12, 12, "#d9cab9");
    }
    sprinklePixels(ctx, "#d7cabd", [
      [174, 250], [294, 284], [420, 246], [1192, 262], [1080, 728],
      [906, 824], [300, 786], [566, 828]
    ]);
    sprinklePixels(ctx, "#bca28f", [
      [250, 342], [610, 332], [892, 350], [536, 572], [794, 584], [1024, 576]
    ]);
    const burger = getCafeBurgerImage();
    const sushi = getCafeSushiImage();
    if (burger?.complete) {
      drawPixelatedImage(ctx, burger, 176, 148, 42, 42, 14, 14);
      drawPixelatedImage(ctx, burger, 252, 148, 42, 42, 14, 14);
    }
    if (sushi?.complete) {
      drawPixelatedImage(ctx, sushi, 1088, 146, 40, 40, 14, 14);
      drawPixelatedImage(ctx, sushi, 1138, 146, 40, 40, 14, 14);
    }
  } else {
    for (let y = 0; y < MAP.height; y += tile) {
      for (let x = 0; x < MAP.width; x += tile) {
        const tone = ((x / tile) + (y / tile)) % 2 === 0 ? "#efede8" : "#e4e0d9";
        fillPixelRect(ctx, x, y, tile, tile, tone);
      }
    }
    fillPixelRect(ctx, 80, 80, MAP.width - 160, 12, "#bfc8cd");
    fillPixelRect(ctx, 80, MAP.height - 92, MAP.width - 160, 12, "#9ea8ae");
    fillPixelRect(ctx, 80, 80, 12, MAP.height - 160, "#bfc8cd");
    fillPixelRect(ctx, MAP.width - 92, 80, 12, MAP.height - 160, "#9ea8ae");
    fillPixelRect(ctx, 1216, 96, 224, 720, "#d8e1e5");
    fillPixelRect(ctx, 1232, 112, 192, 688, "#c9e0e8");
    fillPixelRect(ctx, 128, 128, 320, 96, "#d8dddf");
    fillPixelRect(ctx, 496, 128, 304, 96, "#d8dddf");
    fillPixelRect(ctx, 848, 128, 288, 96, "#d8dddf");
    fillPixelRect(ctx, 224, 168, 160, 8, "#aeb8be");
    fillPixelRect(ctx, 602, 166, 100, 58, "#1f2a33");
    fillPixelRect(ctx, 610, 174, 84, 42, "#2d3945");
    const appleLogo = getProcessedAppleLogoImage() || getAppleLogoImage();
    if (appleLogo) {
      ctx.drawImage(appleLogo, 636, 182, 32, 32);
    }
    fillPixelRect(ctx, 944, 164, 90, 48, "#f8f8f6");
    fillPixelRect(ctx, 952, 172, 74, 32, "#ffffff");
    fillPixelRect(ctx, 968, 180, 8, 8, "#1f2a33");
    fillPixelRect(ctx, 986, 180, 26, 4, "#1f2a33");
    fillPixelRect(ctx, 986, 190, 18, 4, "#1f2a33");
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const x = 214 + column * 226;
        const y = 312 + row * 146;
        fillPixelRect(ctx, x, y, 152, 20, "#d0ccc4");
        fillPixelRect(ctx, x, y + 20, 152, 40, "#ece8e1");
        fillPixelRect(ctx, x, y + 60, 152, 12, "#c2bcb4");
        fillPixelRect(ctx, x + 24, y + 16, 104, 12, "#ffffff");
        fillPixelRect(ctx, x + 16, y + 34, 120, 12, "#dbe4e8");
        fillPixelRect(ctx, x + 48, y + 72, 8, 18, "#9ea8ae");
        fillPixelRect(ctx, x + 96, y + 72, 8, 18, "#9ea8ae");
        fillPixelRect(ctx, x - 20, y + 22, 24, 24, "#a7b0b6");
        fillPixelRect(ctx, x + 148, y + 22, 24, 24, "#a7b0b6");
      }
    }
    fillPixelRect(ctx, 112, 240, 48, 480, "#f1f1f1");
    for (let y = 260; y < 700; y += 54) {
      fillPixelRect(ctx, 116, y, 40, 6, "#d7d7d7");
    }
    sprinklePixels(ctx, "#d0d7db", [
      [232, 260], [402, 222], [588, 246], [980, 260], [1168, 216],
      [286, 700], [714, 688], [1116, 674]
    ]);
    sprinklePixels(ctx, "#b9c1c6", [
      [256, 362], [482, 356], [940, 364], [1188, 354], [510, 510], [952, 644]
    ]);
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
  onPortalSelect,
  currentShotZoneId,
  basketballGameActive
}) {
  const canvasRef = useRef(null);
  const previousPositionsRef = useRef(new Map());

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
      drawAreaScene(ctx, resolvedAreaId, currentShotZoneId, basketballGameActive);
    }

    const nextPositions = new Map();

    players.forEach((player) => {
      if (player?.position && player?.name) {
        const previousPosition = previousPositionsRef.current.get(player.id);
        const deltaX = previousPosition ? player.position.x - previousPosition.x : 0;
        const deltaY = previousPosition ? player.position.y - previousPosition.y : 0;
        drawAvatar(ctx, {
          ...player,
          isMoving: Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5
        });
        nextPositions.set(player.id, {
          x: player.position.x,
          y: player.position.y
        });
      }
    });
    previousPositionsRef.current = nextPositions;
  }, [currentArea, players, previewAreaId, currentShotZoneId, basketballGameActive]);

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
