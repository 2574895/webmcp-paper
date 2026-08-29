import { snapshot } from "./state.js";

function jsonResult(payload) {
  return payload;
}

export async function registerPaperTools(modelContext, paper, { signal } = {}) {
  const options = signal ? { signal } : {};

  await modelContext.registerTool(
    {
      name: "set_text",
      description:
        "Set or replace text on the paper canvas. Provide any of title, body, or caption. Changes appear immediately on the artboard.",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Headline at the top of the paper. Empty string clears it.",
          },
          body: {
            type: "string",
            description: "Main paragraph(s). Use \\n for line breaks.",
          },
          caption: {
            type: "string",
            description: "Small caption at the bottom of the paper.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input = {}) => {
        const result = paper.setText(input, { source: "agent" });
        return jsonResult(result);
      },
    },
    options
  );

  await modelContext.registerTool(
    {
      name: "set_layout",
      description:
        "Change paper layout: alignment, inner margin, type sizes, serif/sans, paper tone, and portrait/square format. Only supplied fields change. The artboard updates in place.",
      inputSchema: {
        type: "object",
        properties: {
          align: {
            type: "string",
            enum: ["left", "center", "right"],
            description: "Horizontal text alignment.",
          },
          margin: {
            type: "integer",
            minimum: 24,
            maximum: 96,
            description: "Inner padding in pixels.",
          },
          titleSize: {
            type: "integer",
            minimum: 28,
            maximum: 84,
            description: "Headline font size in pixels.",
          },
          bodySize: {
            type: "integer",
            minimum: 13,
            maximum: 28,
            description: "Body font size in pixels.",
          },
          font: {
            type: "string",
            enum: ["serif", "sans"],
            description: "serif = myungjo, sans = gothic.",
          },
          paper: {
            type: "string",
            enum: ["ivory", "white", "ink"],
            description: "Paper tone.",
          },
          format: {
            type: "string",
            enum: ["portrait", "square"],
            description: "Artboard proportion.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input = {}) => {
        const result = paper.setLayout(input, { source: "agent" });
        return jsonResult(result);
      },
    },
    options
  );

  await modelContext.registerTool(
    {
      name: "export_png",
      description:
        "Capture only the artboard as a PNG and download it in the browser. Asks the human to confirm before saving. Returns canvas state plus image size, not a raw base64 blob.",
      inputSchema: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Optional download name. .png is appended if missing.",
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input = {}) => {
        return paper.exportPng({
          filename: input.filename,
          confirmDownload: true,
          source: "agent",
        });
      },
    },
    options
  );

  await modelContext.registerTool(
    {
      name: "get_canvas_state",
      description:
        "Read the current title, body, caption, layout, and character counts of the paper canvas. Does not change the page.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async () => {
        return jsonResult({
          ok: true,
          action: "get_canvas_state",
          canvas: snapshot(paper.getState()),
          webmcp: paper.getWebmcpInfo(),
        });
      },
    },
    options
  );
}
