import { useEffect, useRef } from "react";
import jungleLogoUrl from "../assets/jungle-logo.webp";
import basketballPortalUrl from "../assets/portal-basketball.jpg";
import cafeteriaPortalUrl from "../assets/portal-cafeteria.jpeg";
import classroomPortalUrl from "../assets/portal-classroom.png";
import { createRandomAvatar } from "../avatar";
import { AREA_META, DEFAULT_AREA_ID, MAP } from "../constants";
import { AREAS, getAreaById } from "../data/areas";

let lobbyLogoImage = null;
const portalImages = {};
const processedPortalImages = {};

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
  const { x, y, radius, label } = area.portal;
  const portalImage = getProcessedPortalImage(area.id) || getPortalImage(area.id);
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = `${AREA_META[area.id].accent}${isActive ? "40" : "22"}`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + (isActive ? 24 : 14), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = AREA_META[area.id].accent;
  ctx.lineWidth = isActive ? 6 : 4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = "#d1d5d9";
  ctx.beginPath();
  ctx.arc(0, 0, radius - 8, 0, Math.PI * 2);
  ctx.fill();

  if (portalImage) {
    const size = (radius - 14) * 2;
    ctx.drawImage(portalImage, -size / 2, -size / 2, size, size);
  }

  ctx.restore();
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
  } else if (areaId === "cafeteria") {
    ctx.fillStyle = "#7f573f";
    ctx.fillRect(0, 0, MAP.width, MAP.height);
    fillRounded(ctx, 84, 84, MAP.width - 168, MAP.height - 168, 42, "#f1dfc7");
    fillRounded(ctx, 980, 128, 390, 122, 26, "#9f6f43");
    fillRounded(ctx, 166, 132, 260, 110, 26, "#f8f1e4");
    [
      [286, 360],
      [530, 360],
      [774, 360],
      [1018, 360],
      [408, 588],
      [652, 588],
      [896, 588]
    ].forEach(([x, y], index) => {
      fillRounded(ctx, x, y, 110, 110, 28, index % 2 === 0 ? "#c49670" : "#b68561");
      fillRounded(ctx, x + 24, y + 24, 62, 62, 20, "#fff7ec");
    });
  } else {
    ctx.fillStyle = "#5b6d62";
    ctx.fillRect(0, 0, MAP.width, MAP.height);
    fillRounded(ctx, 84, 84, MAP.width - 168, MAP.height - 168, 42, "#efe6d5");
    fillRounded(ctx, 376, 128, 848, 98, 28, "#4f7b65");
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const x = 244 + column * 250;
        const y = 320 + row * 132;
        fillRounded(ctx, x, y, 124, 54, 16, "#9b7047");
        fillRounded(ctx, x + 10, y + 10, 104, 18, 10, "#f7eddc");
      }
    }
    fillRounded(ctx, 1238, 292, 118, 290, 24, "#d1b38b");
  }

  ctx.fillStyle = "#fff8ef";
  ctx.font = "700 40px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(AREA_META[areaId].label, MAP.width / 2, 162);
  ctx.font = "500 20px sans-serif";
  ctx.fillText(AREA_META[areaId].description, MAP.width / 2, 196);

  const area = getAreaById(areaId);
  if (area?.returnPortal) {
    ctx.save();
    ctx.translate(area.returnPortal.x, area.returnPortal.y);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, area.returnPortal.radius + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, area.returnPortal.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px sans-serif";
    ctx.fillText("LOBBY", 0, 8);
    ctx.restore();
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
    const ctx = canvas.getContext("2d");
    if (currentArea === DEFAULT_AREA_ID) {
      drawLobbyScene(ctx, previewAreaId);
    } else {
      drawAreaScene(ctx, currentArea);
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
