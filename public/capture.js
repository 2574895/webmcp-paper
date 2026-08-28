function wrapLines(ctx, text, maxWidth) {
  const paragraphs = String(text ?? "").split("\n");
  const lines = [];
  for (const paragraph of paragraphs) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }
    let line = "";
    for (const ch of paragraph) {
      const next = line + ch;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = ch;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawTextBox(ctx, el, root) {
  const cs = getComputedStyle(el);
  const rootRect = root.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  const x = rect.left - rootRect.left;
  const y = rect.top - rootRect.top;
  const maxWidth = Math.max(1, el.clientWidth);
  const fontSize = parseFloat(cs.fontSize) || 16;
  const lineHeight = Number.isFinite(parseFloat(cs.lineHeight))
    ? parseFloat(cs.lineHeight)
    : fontSize * 1.5;

  ctx.save();
  ctx.fillStyle = cs.color;
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.textBaseline = "top";
  const align = cs.textAlign === "center" || cs.textAlign === "right" ? cs.textAlign : "left";
  ctx.textAlign = align;
  let drawX = x;
  if (align === "center") drawX = x + maxWidth / 2;
  if (align === "right") drawX = x + maxWidth;

  const lines = wrapLines(ctx, el.textContent, maxWidth);
  const maxLines = Math.max(1, Math.floor(el.clientHeight / lineHeight) + 1);
  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line, drawX, y + index * lineHeight, maxWidth);
  });
  ctx.restore();
}

function pngByteLength(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function captureArtboardPng(artboard, { scale = 2 } = {}) {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await nextFrame();
  await nextFrame();

  const width = Math.round(artboard.clientWidth);
  const height = Math.round(artboard.clientHeight);
  if (width < 8 || height < 8) {
    throw new Error("아트보드 크기를 읽을 수 없습니다.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D를 사용할 수 없습니다.");

  ctx.scale(scale, scale);
  const paper = getComputedStyle(artboard);
  ctx.fillStyle = paper.backgroundColor || "#f6f1e6";
  ctx.fillRect(0, 0, width, height);

  for (const selector of [".paper-title", ".paper-body", ".paper-caption"]) {
    const el = artboard.querySelector(selector);
    if (el) drawTextBox(ctx, el, artboard);
  }

  const dataUrl = canvas.toDataURL("image/png");
  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    byteLength: pngByteLength(dataUrl),
  };
}

export function downloadPng(dataUrl, filename) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function defaultPngName(title) {
  const slug = String(title || "paper")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug || "paper"}.png`;
}
