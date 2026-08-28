const DEFAULT_STATE = {
  title: "열린 종이",
  body: "사람이 이 종이에 글을 씁니다.\n여백을 열고, 글을 가운데 두고, PNG로 가져갑니다.\n\n에이전트도 채팅창이 아니라 이 화면의 같은 버튼을 도구로 부릅니다. 도구가 실행되면 종이가 그 자리에서 바뀝니다.",
  caption: "WebMCP Challenge · MIT",
  align: "left",
  margin: 56,
  titleSize: 52,
  bodySize: 17,
  font: "serif",
  paper: "ivory",
  format: "portrait",
};

const ALIGN = new Set(["left", "center", "right"]);
const FONT = new Set(["serif", "sans"]);
const PAPER = new Set(["ivory", "white", "ink"]);
const FORMAT = new Set(["portrait", "square"]);

export function createDefaultState() {
  return { ...DEFAULT_STATE };
}

export function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(Math.min(max, Math.max(min, n)));
}

export function normalizeText(value, fallback, maxLength) {
  if (value == null) return fallback;
  return String(value).slice(0, maxLength);
}

export function pickLayoutPatch(input = {}) {
  const patch = {};
  if (input.align != null) {
    const align = String(input.align);
    if (!ALIGN.has(align)) {
      throw new Error("align은 left, center, right 중 하나여야 합니다.");
    }
    patch.align = align;
  }
  if (input.margin != null) patch.margin = clampInt(input.margin, 24, 96, 56);
  if (input.titleSize != null) patch.titleSize = clampInt(input.titleSize, 28, 84, 52);
  if (input.bodySize != null) patch.bodySize = clampInt(input.bodySize, 13, 28, 17);
  if (input.font != null) {
    const font = String(input.font);
    if (!FONT.has(font)) throw new Error("font는 serif 또는 sans 여야 합니다.");
    patch.font = font;
  }
  if (input.paper != null) {
    const paper = String(input.paper);
    if (!PAPER.has(paper)) throw new Error("paper는 ivory, white, ink 중 하나여야 합니다.");
    patch.paper = paper;
  }
  if (input.format != null) {
    const format = String(input.format);
    if (!FORMAT.has(format)) throw new Error("format은 portrait 또는 square 여야 합니다.");
    patch.format = format;
  }
  return patch;
}

export function snapshot(state) {
  return {
    title: state.title,
    body: state.body,
    caption: state.caption,
    layout: {
      align: state.align,
      margin: state.margin,
      titleSize: state.titleSize,
      bodySize: state.bodySize,
      font: state.font,
      paper: state.paper,
      format: state.format,
    },
    metrics: {
      titleChars: state.title.length,
      bodyChars: state.body.length,
      captionChars: state.caption.length,
    },
  };
}
