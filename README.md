# 지필 Paper

WebMCP Challenge용 **한 페이지 종이 캔버스**입니다.

사람이 화면에서 제목·본문·캡션을 쓰고 판형을 바꾸면, 에이전트도 `document.modelContext.registerTool` 로 **같은 액션**을 실행합니다. 채팅 UI를 도구로 감싸지 않습니다. 종이가 곧 인터페이스입니다.

채봇 래핑 없음. GrapesJS / Playwright / stdio MCP 없음.

## 사람이 하는 일

1. 왼쪽 칸 또는 종이 위를 직접 눌러 제목, 본문, 캡션을 고칩니다.
2. 정렬(왼쪽/가운데/오른쪽), 여백, 제목·본문 크기, 명조/고딕, 아이보리·백지·먹색, 세로/정사각을 바꿉니다.
3. **PNG로 저장**을 누르면 아트보드만 PNG로 내려받습니다. 스튜디오 배경과 편집 칸은 들어가지 않습니다.
4. 에이전트가 도구를 실행하면 종이가 그 자리에서 바뀌고, 왼쪽 아래에 방금 일어난 일이 적힙니다.

WebMCP가 없는 브라우저에서도 사람 UI는 그대로 동작합니다.

## 에이전트 도구

Imperative API만 사용합니다.

```js
const modelContext = document.modelContext || navigator.modelContext;
if (modelContext && "registerTool" in modelContext) {
  await modelContext.registerTool({ name, description, inputSchema, execute }, { signal });
}
```

`navigator.modelContext` 는 Chrome 150에서 deprecated된 별칭입니다. `registerTool`이 없으면 등록을 건너뜁니다. 해제 API는 없으므로 `AbortSignal`로 등록을 끊습니다.

| 도구 | 사람 UI와 1:1 | 동작 |
| --- | --- | --- |
| `set_text` | 제목 / 본문 / 캡션 입력 | 캔버스 글을 넣고 바꿉니다. 화면 즉시 반영. |
| `set_layout` | 정렬, 여백, 크기, 글꼴, 종이, 판형 | 레이아웃을 바꿉니다. 화면 즉시 반영. |
| `export_png` | PNG로 저장 | 아트보드만 canvas로 캡처해 다운로드합니다. 에이전트 호출 시 확인 창. |
| `get_canvas_state` | 현재 종이 읽기 (`readOnlyHint: true`) | 텍스트·레이아웃·글자 수 요약을 반환합니다. |

모든 `execute`는 앱 로직(`window.Paper`)을 호출하고, 변경 후 캔버스 상태를 구조화해 반환합니다. `{ ok: true }`만 반환하지 않습니다. 질문/채팅 도구는 없습니다.

## 로컬 실행

의존성 설치가 필요 없습니다.

```bash
python3 -m http.server 8788 --directory public
```

브라우저에서 `http://localhost:8788` 을 엽니다.

Cloudflare Pages로 미리 보려면:

```bash
npx wrangler pages dev public
```

## WebMCP 테스트

1. **Chrome**  
   `chrome://flags/#enable-webmcp-testing` 를 Enabled로 두고 Chrome을 다시 시작합니다. 이 페이지를 연 뒤, 페이지가 등록한 도구(`set_text`, `set_layout`, `export_png`, `get_canvas_state`)를 호출합니다.
2. **ChatGPT 데스크톱 인앱 브라우저**  
   라이브 URL(또는 로컬 HTTPS/허용된 주소)을 인앱 브라우저로 연 다음, 같은 화면에서 글을 바꾸거나 PNG를 저장하도록 요청합니다. 채팅 도구가 아니라 종이 액션이 실행되어야 합니다.

WebMCP는 Secure Context(HTTPS 또는 localhost)가 필요합니다.

## 배포

설정 파일: 루트 `wrangler.toml` (`pages_build_output_dir = "./public"`).

```bash
npx wrangler pages deploy public --project-name webmcp-paper
```

**라이브 URL:** https://webmcp-paper.pages.dev/

Cloudflare Pages의 `webmcp-paper` 프로젝트에 Direct Upload 방식으로 배포합니다. `dhyun.tech` DNS와 다른 Pages 프로젝트는 변경하지 않습니다.

## 라이선스

MIT. 루트 `LICENSE` 파일을 봅니다.
