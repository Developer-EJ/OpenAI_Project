import { useEffect, useRef } from "react";
import { MAP } from "../constants";
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

function drawWoodHall(ctx) {
  ctx.clearRect(0, 0, MAP.width, MAP.height);
  const woodA = "#c89c68";
  const woodB = "#b68653";
  const wall = "#efe0ca";
  const trim = "#8f633e";

  ctx.fillStyle = "#6c4c35";
  ctx.fillRect(0, 0, MAP.width, MAP.height);

  ctx.fillStyle = wall;
  roundRect(ctx, 28, 28, MAP.width - 56, MAP.height - 56, 24);
  ctx.fill();

  for (let y = 64; y < MAP.height - 64; y += MAP.tile) {
    for (let x = 64; x < MAP.width - 64; x += MAP.tile) {
      ctx.fillStyle = (x / MAP.tile + y / MAP.tile) % 2 === 0 ? woodA : woodB;
      roundRect(ctx, x, y, MAP.tile - 6, MAP.tile - 6, 10);
      ctx.fill();
    }
  }

  ctx.fillStyle = trim;
  roundRect(ctx, 510, 86, 580, 150, 20);
  ctx.fill();
  ctx.fillStyle = "#f6ead7";
  roundRect(ctx, 542, 108, 516, 106, 16);
  ctx.fill();

  ctx.fillStyle = "#9b7047";
  roundRect(ctx, 660, 236, 280, 48, 20);
  ctx.fill();

  const deskYRows = [340, 500, 660];
  deskYRows.forEach((rowY, rowIndex) => {
    for (let index = 0; index < 5; index += 1) {
      const x = 210 + index * 230 + (rowIndex % 2 === 0 ? 0 : 48);
      ctx.fillStyle = "#8e623e";
      roundRect(ctx, x, rowY, 138, 54, 14);
      ctx.fill();
      ctx.fillStyle = "#f2e3cc";
      roundRect(ctx, x + 8, rowY + 8, 122, 28, 10);
      ctx.fill();
      ctx.fillStyle = "#5a4030";
      roundRect(ctx, x + 18, rowY + 50, 26, 24, 8);
      ctx.fill();
      roundRect(ctx, x + 94, rowY + 50, 26, 24, 8);
      ctx.fill();
    }
  });

  ctx.fillStyle = "#7f5b3d";
  roundRect(ctx, 680, 778, 240, 84, 18);
  ctx.fill();
  ctx.fillStyle = "#fbf2e4";
  roundRect(ctx, 704, 792, 192, 52, 16);
  ctx.fill();

  ctx.fillStyle = "#5d3d29";
  ctx.font = "700 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("KRAFTON JUNGLE CAMPUS", MAP.width / 2, 170);
  ctx.font = "500 18px sans-serif";
  ctx.fillText("따뜻한 분위기의 실시간 교육장", MAP.width / 2, 204);
}

export default function HallCanvas({ players }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawWoodHall(ctx);
    players.forEach((player) => {
      if (player?.position && player?.name) {
        drawAvatar(ctx, player);
      }
    });
  }, [players]);

  return (
    <div className="canvas-shell">
      <canvas ref={canvasRef} width={MAP.width} height={MAP.height} />
    </div>
  );
}
