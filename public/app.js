import {
  createDefaultState,
  normalizeText,
  pickLayoutPatch,
  snapshot,
} from "./state.js";
import { captureArtboardPng, defaultPngName, downloadPng } from "./capture.js";
import { registerPaperTools } from "./webmcp.js";

const state = createDefaultState();
let webmcp = { available: false, registered: false, source: null };

const els = {
  artboard: document.querySelector("#artboard"),
  title: document.querySelector("#paper-title"),
  body: document.querySelector("#paper-body"),
  caption: document.querySelector("#paper-caption"),
  form: document.querySelector("#editor"),
  fieldTitle: document.querySelector("#field-title"),
  fieldBody: document.querySelector("#field-body"),
  fieldCaption: document.querySelector("#field-caption"),
  fieldMargin: document.querySelector("#field-margin"),
  fieldTitleSize: document.querySelector("#field-titleSize"),
  fieldBodySize: document.querySelector("#field-bodySize"),
  marginReadout: document.querySelector("#margin-readout"),
  titleSizeReadout: document.querySelector("#titleSize-readout"),
  bodySizeReadout: document.querySelector("#bodySize-readout"),
  exportButton: document.querySelector("#export-button"),
  resetButton: document.querySelector("#reset-button"),
  status: document.querySelector("#webmcp-status"),
  lastAction: document.querySelector("#last-action"),
};

function setLastAction(message) {
  els.lastAction.textContent = message;
}

function pulseArtboard() {
  els.artboard.classList.remove("is-agent-touch");
  void els.artboard.offsetWidth;
  els.artboard.classList.add("is-agent-touch");
}

function renderArtboard() {
  els.artboard.dataset.align = state.align;
  els.artboard.dataset.font = state.font;
  els.artboard.dataset.paper = state.paper;
  els.artboard.dataset.format = state.format;
  els.artboard.style.setProperty("--paper-pad", `${state.margin}px`);
  els.artboard.style.setProperty("--title-size", `${state.titleSize}px`);
  els.artboard.style.setProperty("--body-size", `${state.bodySize}px`);
  if (document.activeElement !== els.title) els.title.textContent = state.title;
  if (document.activeElement !== els.body) els.body.textContent = state.body;
  if (document.activeElement !== els.caption) els.caption.textContent = state.caption;
}

function syncForm() {
  if (document.activeElement !== els.fieldTitle) els.fieldTitle.value = state.title;
  if (document.activeElement !== els.fieldBody) els.fieldBody.value = state.body;
  if (document.activeElement !== els.fieldCaption) els.fieldCaption.value = state.caption;
  els.fieldMargin.value = String(state.margin);
  els.fieldTitleSize.value = String(state.titleSize);
  els.fieldBodySize.value = String(state.bodySize);
  els.marginReadout.textContent = `${state.margin}px`;
  els.titleSizeReadout.textContent = `${state.titleSize}px`;
  els.bodySizeReadout.textContent = `${state.bodySize}px`;
  for (const name of ["align", "font", "paper", "format"]) {
    const selected = els.form.querySelector(`input[name="${name}"][value="${state[name]}"]`);
    if (selected) selected.checked = true;
  }
}

function paint({ source = "ui" } = {}) {
  renderArtboard();
  syncForm();
  if (source === "agent") pulseArtboard();
}

function setWebmcpStatus(info) {
  webmcp = { ...webmcp, ...info };
  if (webmcp.registered) {
    els.status.dataset.state = "on";
    els.status.textContent = `WebMCP 연결됨 · ${webmcp.source}`;
  } else {
    els.status.dataset.state = "off";
    els.status.textContent = "사람 UI만 동작 · 이 브라우저는 WebMCP 없음";
  }
}

export const paper = {
  getState() {
    return { ...state };
  },
  getWebmcpInfo() {
    return { ...webmcp };
  },
  setText(input = {}, { source = "ui" } = {}) {
    const hasAny =
      Object.prototype.hasOwnProperty.call(input, "title") ||
      Object.prototype.hasOwnProperty.call(input, "body") ||
      Object.prototype.hasOwnProperty.call(input, "caption");
    if (!hasAny) {
      throw new Error("title, body, caption 중 하나 이상이 필요합니다.");
    }
    const changed = [];
    if (Object.prototype.hasOwnProperty.call(input, "title")) {
      state.title = normalizeText(input.title, "", 120);
      changed.push("title");
    }
    if (Object.prototype.hasOwnProperty.call(input, "body")) {
      state.body = normalizeText(input.body, "", 2000);
      changed.push("body");
    }
    if (Object.prototype.hasOwnProperty.call(input, "caption")) {
      state.caption = normalizeText(input.caption, "", 160);
      changed.push("caption");
    }
    paint({ source });
    setLastAction(
      source === "agent"
        ? `에이전트가 글을 바꿨습니다: ${changed.join(", ")}`
        : "글을 고쳤습니다."
    );
    return {
      ok: true,
      action: "set_text",
      changed,
      source,
      canvas: snapshot(state),
    };
  },
  setLayout(input = {}, { source = "ui" } = {}) {
    const patch = pickLayoutPatch(input);
    const changed = Object.keys(patch);
    if (!changed.length) {
      throw new Error("바꿀 레이아웃 값이 없습니다.");
    }
    Object.assign(state, patch);
    paint({ source });
    setLastAction(
      source === "agent"
        ? `에이전트가 판형을 바꿨습니다: ${changed.join(", ")}`
        : "판형을 바꿨습니다."
    );
    return {
      ok: true,
      action: "set_layout",
      changed,
      source,
      canvas: snapshot(state),
    };
  },
  async exportPng({ filename, confirmDownload = false, source = "ui" } = {}) {
    let name = String(filename || defaultPngName(state.title)).trim() || defaultPngName(state.title);
    if (!name.toLowerCase().endsWith(".png")) name += ".png";
    if (confirmDownload) {
      const allowed = window.confirm(`아트보드만 PNG 파일 «${name}» 로 저장할까요?`);
      if (!allowed) {
        setLastAction("PNG 저장을 취소했습니다.");
        return {
          ok: false,
          cancelled: true,
          action: "export_png",
          filename: name,
          source,
          canvas: snapshot(state),
        };
      }
    }
    const image = await captureArtboardPng(els.artboard);
    downloadPng(image.dataUrl, name);
    if (source === "agent") pulseArtboard();
    setLastAction(`PNG를 저장했습니다 (${image.width}×${image.height}).`);
    return {
      ok: true,
      action: "export_png",
      filename: name,
      mimeType: "image/png",
      width: image.width,
      height: image.height,
      byteLength: image.byteLength,
      downloaded: true,
      source,
      canvas: snapshot(state),
    };
  },
  reset({ source = "ui" } = {}) {
    Object.assign(state, createDefaultState());
    paint({ source });
    setLastAction(source === "agent" ? "에이전트가 처음 글로 되돌렸습니다." : "처음 글로 되돌렸습니다.");
    return {
      ok: true,
      action: "reset_canvas",
      source,
      canvas: snapshot(state),
    };
  },
};

window.Paper = paper;

function bindForm() {
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  els.fieldTitle.addEventListener("input", () => {
    paper.setText({ title: els.fieldTitle.value });
  });
  els.fieldBody.addEventListener("input", () => {
    paper.setText({ body: els.fieldBody.value });
  });
  els.fieldCaption.addEventListener("input", () => {
    paper.setText({ caption: els.fieldCaption.value });
  });

  els.form.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (["align", "font", "paper", "format"].includes(target.name)) {
      paper.setLayout({ [target.name]: target.value });
    }
  });

  els.fieldMargin.addEventListener("input", () => {
    paper.setLayout({ margin: els.fieldMargin.value });
  });
  els.fieldTitleSize.addEventListener("input", () => {
    paper.setLayout({ titleSize: els.fieldTitleSize.value });
  });
  els.fieldBodySize.addEventListener("input", () => {
    paper.setLayout({ bodySize: els.fieldBodySize.value });
  });

  els.exportButton.addEventListener("click", () => {
    paper.exportPng({ source: "ui" }).catch((error) => {
      setLastAction(`PNG 저장 실패: ${error.message}`);
    });
  });
  els.resetButton.addEventListener("click", () => paper.reset());
}

function bindPaperEditing() {
  const map = [
    [els.title, "title"],
    [els.body, "body"],
    [els.caption, "caption"],
  ];
  for (const [node, key] of map) {
    node.addEventListener("input", () => {
      paper.setText({ [key]: node.textContent ?? "" });
    });
  }
  els.title.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      els.body.focus();
    }
  });
}

async function connectWebmcp() {
  const modelContext = document.modelContext || navigator.modelContext;
  if (!modelContext || !("registerTool" in modelContext)) {
    setWebmcpStatus({ available: false, registered: false, source: null });
    return;
  }

  const source = document.modelContext ? "document.modelContext" : "navigator.modelContext";
  const controller = new AbortController();
  window.addEventListener("pagehide", () => controller.abort(), { once: true });

  try {
    await registerPaperTools(modelContext, paper, { signal: controller.signal });
    setWebmcpStatus({ available: true, registered: true, source });
    setLastAction("에이전트 도구 4개를 이 페이지에 등록했습니다.");
  } catch (error) {
    setWebmcpStatus({ available: true, registered: false, source });
    setLastAction(`WebMCP 등록 실패: ${error.message}`);
  }
}

bindForm();
bindPaperEditing();
paint({ source: "ui" });
connectWebmcp();
