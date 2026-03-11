import { useEffect, useRef } from "react";
import { AREA_META, DEFAULT_AREA_ID, MAP } from "../constants";
import { createRandomAvatar } from "../avatar";

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

function drawAvatar(ctx, player) {
  const { x, y } = player.position;
  const avatar = player.avatar || createRandomAvatar(0.42);

  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(41, 24, 14, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 20, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = avatar.top;
  roundRect(ctx, -16, -2, 32, 28, 10);
  ctx.fill();

  ctx.fillStyle = avatar.accent;
  roundRect(ctx, -7, 8, 14, 8, 4);
  ctx.fill();

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

  if (avatar.face === 1) {
    ctx.strokeStyle = "#8f4d3c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (avatar.face === 2) {
    ctx.strokeStyle = "#8f4d3c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(5, -8);
    ctx.stroke();
  }

  if (avatar.accessory === 1) {
    ctx.strokeStyle = "#f7f1db";
    ctx.lineWidth = 2;
    ctx.strokeRect(-9, -19, 8, 6);
    ctx.strokeRect(1, -19, 8, 6);
    ctx.beginPath();
    ctx.moveTo(-1, -16);
    ctx.lineTo(1, -16);
    ctx.stroke();
  }

  if (avatar.accessory === 2) {
    ctx.fillStyle = "#f1cc7a";
    ctx.fillRect(-4, -36, 8, 6);
  }

  ctx.fillStyle = "#3d2518";
  ctx.font = "600 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(player.name, 0, -44);

  ctx.fillStyle = "#e9d5b7";
  ctx.font = "12px sans-serif";
  ctx.fillText(player.classroom, 0, -58);

  if (player.lastMessage) {
    const bubbleWidth = Math.min(180, Math.max(90, player.lastMessage.length * 9));
    ctx.fillStyle = "rgba(255, 250, 242, 0.95)";
    ctx.strokeStyle = "rgba(89, 57, 37, 0.28)";
    roundRect(ctx, -bubbleWidth / 2, -102, bubbleWidth, 30, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4a2d1d";
    ctx.font = "12px sans-serif";
    ctx.fillText(player.lastMessage.slice(0, 20), 0, -82);
  }

  ctx.restore();
}

function getAreaTheme(areaId) {
  switch (areaId) {
    case "basketball":
      return {
        frame: "#6b4323",
        panel: "#f3d1a5",
        floorA: "#cf8d49",
        floorB: "#ba7537",
        deco: "#f7f2ea",
        headline: "BASKETBALL COURT",
        subline: "빠르게 팀을 꾸리고 한 판 뛰어보세요."
      };
    case "classroom":
      return {
        frame: "#36566d",
        panel: "#dcebf5",
        floorA: "#b6d1e5",
        floorB: "#9fc0d9",
        deco: "#f9fbfd",
        headline: "LEARNING STUDIO",
        subline: "스터디와 세션을 위한 집중 공간입니다."
      };
    case "cafeteria":
      return {
        frame: "#4c6b3a",
        panel: "#dfeec9",
        floorA: "#b8d88c",
        floorB: "#9dc16d",
        deco: "#fffdf5",
        headline: "CAMPUS CAFE",
        subline: "식사 메이트와 편한 대화를 시작해보세요."
      };
    case DEFAULT_AREA_ID:
    default:
      return {
        frame: "#6c4c35",
        panel: "#efe0ca",
        floorA: "#c89c68",
        floorB: "#b68653",
        deco: "#f6ead7",
        headline: "JUNGLE MAIN LOBBY",
        subline: "농구장, 교육장, 식당으로 이어지는 메인 허브입니다."
      };
  }
}

function drawScene(ctx, areaId) {
  const theme = getAreaTheme(areaId);
  const meta = AREA_META[areaId] || AREA_META[DEFAULT_AREA_ID];

  ctx.clearRect(0, 0, MAP.width, MAP.height);
  ctx.fillStyle = theme.frame;
  ctx.fillRect(0, 0, MAP.width, MAP.height);

  ctx.fillStyle = theme.panel;
  roundRect(ctx, 28, 28, MAP.width - 56, MAP.height - 56, 24);
  ctx.fill();

  for (let y = 64; y < MAP.height - 64; y += MAP.tile) {
    for (let x = 64; x < MAP.width - 64; x += MAP.tile) {
      ctx.fillStyle = (x / MAP.tile + y / MAP.tile) % 2 === 0 ? theme.floorA : theme.floorB;
      roundRect(ctx, x, y, MAP.tile - 6, MAP.tile - 6, 10);
      ctx.fill();
    }
  }

  ctx.fillStyle = theme.frame;
  roundRect(ctx, 520, 82, 560, 148, 22);
  ctx.fill();
  ctx.fillStyle = theme.deco;
  roundRect(ctx, 548, 106, 504, 102, 16);
  ctx.fill();

  if (areaId === DEFAULT_AREA_ID) {
    [
      { x: 174, y: 360, label: "농구장 이동" },
      { x: 620, y: 540, label: "교육장 이동" },
      { x: 1050, y: 360, label: "식당 이동" }
    ].forEach((portal) => {
      ctx.fillStyle = "rgba(255, 248, 238, 0.78)";
      roundRect(ctx, portal.x, portal.y, 260, 120, 24);
      ctx.fill();
      ctx.fillStyle = theme.frame;
      ctx.font = "700 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(portal.label, portal.x + 130, portal.y + 66);
    });
  } else {
    const rows = areaId === "basketball" ? [330, 500, 670] : [330, 500];
    rows.forEach((rowY, rowIndex) => {
      for (let index = 0; index < 4; index += 1) {
        const x = 210 + index * 280 + (rowIndex % 2 === 0 ? 0 : 40);
        ctx.fillStyle = theme.frame;
        roundRect(ctx, x, rowY, 170, 54, 14);
        ctx.fill();
        ctx.fillStyle = theme.deco;
        roundRect(ctx, x + 8, rowY + 8, 154, 28, 10);
        ctx.fill();
      }
    });
  }

  ctx.fillStyle = theme.frame;
  ctx.font = "700 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(theme.headline, MAP.width / 2, 168);
  ctx.font = "500 18px sans-serif";
  ctx.fillText(theme.subline, MAP.width / 2, 202);

  ctx.fillStyle = meta.accent;
  roundRect(ctx, 84, 88, 250, 92, 20);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 28px sans-serif";
  ctx.fillText(meta.label, 209, 138);
}

export default function HallCanvas({ currentArea, players }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawScene(ctx, currentArea);
    players.forEach((player) => {
      if (player?.position && player?.name) {
        drawAvatar(ctx, player);
      }
    });
  }, [currentArea, players]);

  return (
    <div className="canvas-shell">
      <canvas ref={canvasRef} width={MAP.width} height={MAP.height} />
    </div>
  );
}