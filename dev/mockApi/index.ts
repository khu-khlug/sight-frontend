import { readFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";

import { handleAutosaveRequest } from "./autosave";
import { currentUser, emptyGuildEmojis, emptyNotifications } from "./fixtures";
import { findMockCardTitle, handleGroupRequest, uploads } from "./groups";
import { handleRepositoryRequest } from "./repository";
import { handleScheduleRequest } from "./schedules";

const API_PREFIX = "/__mock-api";
const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "assets");
// 칸반 카드 커버 미리보기 목업 이미지 — groupFixtures.ts가 coverImageUrl로 이 경로를 가리킨다.
const KANBAN_COVER_DEMO_SVG = readFileSync(path.join(ASSETS_DIR, "kanban-cover-demo.svg"));
// 운영진 페이지(/manage/...)를 바로 볼 수 있게 기본은 운영진이다. MOCK_MANAGER=false로 시작하면 일반 회원이고,
// 개발 탭에서 런타임에 토글할 수 있게 let로 둔다.
let mockManager = process.env.MOCK_MANAGER !== "false";
let usePersonalGithubUsage = false;

class MockRequestError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

// 채팅 전송처럼 multipart로 오는 요청을 { content, attachments } 객체로 바꾼다. 첨부 파일은 data URL로 둔다.
async function parseMultipart(raw: Buffer, contentType: string) {
  let form: FormData;
  try {
    form = await new Request("http://mock.local", { method: "POST", headers: { "content-type": contentType }, body: raw }).formData();
  } catch {
    throw new MockRequestError(400, "첨부 파일 요청 형식을 확인해주세요.");
  }
  if ([...form.keys()].some((key) => key !== "content" && key !== "files")) {
    throw new MockRequestError(400, "본문은 content, 첨부 파일은 files 파트로 보내주세요.");
  }
  const content = form.get("content");
  if (form.getAll("content").length > 1 || (content !== null && typeof content !== "string")) {
    throw new MockRequestError(400, "메시지 본문은 텍스트로 보내주세요.");
  }
  const parts = form.getAll("files");
  if (parts.some((part) => typeof part === "string")) {
    throw new MockRequestError(400, "첨부 파일은 파일 파트로 보내주세요.");
  }
  const files = parts as (Blob & { name: string })[];
  if (files.some((file) => file.size > 20 * 1024 * 1024) || files.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024) {
    throw new MockRequestError(413, "첨부 파일 용량이 너무 큽니다.");
  }
  if (typeof content === "string" && content.length > 2000) {
    throw new MockRequestError(400, "메시지는 2000자 이하여야 합니다.");
  }
  const attachments = await Promise.all(files.map(async (file) => ({
    name: file.name,
    contentType: file.type || null,
    size: file.size,
    url: `data:${file.type || "application/octet-stream"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`,
  })));
  return { content: typeof content === "string" ? content : "", attachments };
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  if (status === 204) {
    response.writeHead(status, { "Cache-Control": "no-store" });
    response.end();
    return;
  }
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  response.end(payload);
}

export function mockApi(): Plugin {
  return {
    name: "sight-mock-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        const pathname = url.pathname;
        if (pathname !== API_PREFIX && !pathname.startsWith(`${API_PREFIX}/`)) {
          next();
          return;
        }

        const route = pathname.slice(API_PREFIX.length);
        url.pathname = route;
        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of request) {
            const buffer = Buffer.from(chunk);
            size += buffer.length;
            if (size > 30 * 1024 * 1024) {
              sendJson(response, 413, { message: "파일 또는 요청 크기가 너무 큽니다." });
              return;
            }
            chunks.push(buffer);
          }
          const raw = Buffer.concat(chunks);
          // 파일을 내려주는 경로는 HEAD도 GET과 같은 헤더로 응답한다(본문은 Node가 HEAD 응답에서 뺀다) —
          // 기록 편집창이 파일을 넣을 때 내용을 받지 않고 Content-Length로 용량만 확인한다.
          const fileMethod = request.method === "HEAD" ? "GET" : request.method;
          if (route.startsWith("/uploads/")) {
            const upload = uploads.get(route.slice("/uploads/".length));
            if (!upload) { sendJson(response, 404, { message: "업로드 정보를 찾을 수 없습니다." }); return; }
            if (request.method === "PUT") {
              if (upload.used || !raw.length) { sendJson(response, 400, { message: "빈 파일 또는 이미 사용한 업로드입니다." }); return; }
              upload.data = raw;
              sendJson(response, 204, undefined);
              return;
            }
            if (fileMethod === "GET" && upload.data) {
              response.writeHead(200, {
                "Content-Type": upload.inline ? upload.contentType : "application/octet-stream",
                "Content-Disposition": `${upload.inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(upload.fileName)}`,
                "Content-Length": upload.data.length,
                "Cache-Control": "no-store",
              });
              response.end(upload.data);
              return;
            }
            sendJson(response, 404, { message: "업로드된 파일이 없습니다." }); return;
          }
          if (fileMethod === "GET" && route === "/assets/kanban-cover-demo.svg") {
            response.writeHead(200, { "Content-Type": "image/svg+xml", "Content-Length": KANBAN_COVER_DEMO_SVG.length, "Cache-Control": "no-store" });
            response.end(KANBAN_COVER_DEMO_SVG); return;
          }
          if (fileMethod === "GET" && route.startsWith("/demo-files/")) {
            // 목업 서버에서 내려주는 최소한의 PDF 파일 데이터.
            const content = "BT /F1 18 Tf 50 740 Td (SIGHT mock activity report) Tj ET";
            const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
            let pdf = "%PDF-1.4\n";
            const offsets = [0];
            objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
            const xref = pdf.length;
            pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
            response.writeHead(200, { "Content-Type": "application/pdf", "Content-Length": Buffer.byteLength(pdf), "Cache-Control": "no-store" });
            response.end(pdf); return;
          }
          if (fileMethod === "GET" && route.startsWith("/repository-raw-files/")) {
            // 저장소 탭의 파일 창이 보여줄 목업 내용. 실제로는 GitHub 등의 raw 도메인 주소를
            // 그대로 쓰므로 이 경로는 개발 서버에만 존재한다.
            const filePath = decodeURIComponent(route.slice("/repository-raw-files/".length));
            // 파일 창의 세로 스크롤과(120줄) 가로 스크롤/줄바꿈 토글(10줄마다 긴 줄)을 실제로
            // 확인할 수 있게 충분히 긴 텍스트를 만든다. 실제 파일 내용은 백엔드가 내려주는 raw
            // 도메인 주소에서 그대로 가져온다.
            const lines = [
              `// ${filePath}`,
              "// 저장소 파일 미리보기 목업입니다.",
            ];
            for (let i = 1; i <= 120; i += 1) {
              const long = i % 10 === 0 ? ` — 이 줄은 가로 스크롤/자동 줄바꿈 토글 확인을 위해 일부러 길게 늘려 둔 더미 주석입니다.`.repeat(3) : "";
              lines.push(`export const mockLine${i} = ${i};${long}`);
            }
            const content = `${lines.join("\n")}\n`;
            response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Content-Length": Buffer.byteLength(content), "Cache-Control": "no-store" });
            response.end(content); return;
          }
          const contentType = request.headers["content-type"] ?? "";
          if (request.method === "POST" && /^\/groups\/[^/]+\/chat-messages$/.test(route) && !/^multipart\/form-data(?:;|$)/i.test(contentType)) {
            throw new MockRequestError(415, "채팅 메시지는 multipart/form-data로 보내주세요.");
          }
          const body: unknown = /^multipart\/form-data(?:;|$)/i.test(contentType)
            ? await parseMultipart(raw, contentType)
            : raw.length ? JSON.parse(raw.toString("utf8")) : undefined;
          const result = handleScheduleRequest(request.method, url, body) ?? handleRepositoryRequest(request.method, url, body) ?? handleAutosaveRequest(request.method, url, body, findMockCardTitle) ?? handleGroupRequest(request.method, url, body, mockManager);
          if (result) {
            if ("headers" in result && result.headers) { response.writeHead(result.status, result.headers as Record<string, string>); response.end(); }
            else sendJson(response, result.status, result.body);
            return;
          }
        // 그룹 쪽(groups.ts의 "mock-scenario" PATCH)과 같은 패턴 — 현재 사용자는 그룹에 속하지
        // 않는 전역 상태라 groups.ts가 아니라 여기서 직접 들고 있는다. 개발 탭(GroupDevelopment)
        // 이 이 값을 바꿔 "내가 운영진인지"를 토글할 수 있게 한다.
        if (request.method === "PATCH" && route === "/users/@me/mock-scenario") {
          const input = body && typeof body === "object" ? body as { manager?: unknown } : {};
          if (typeof input.manager === "boolean") mockManager = input.manager;
          sendJson(response, 204, undefined);
        } else if (request.method === "GET" && route === "/users/@me/preference") {
          sendJson(response, 200, { usePersonalGithubUsage });
        } else if (request.method === "PATCH" && route === "/users/@me/preference") {
          const input = body && typeof body === "object" ? body as { usePersonalGithubUsage?: unknown } : {};
          if (typeof input.usePersonalGithubUsage !== "boolean") { sendJson(response, 400, { message: "개인 사용량 설정을 확인해 주세요." }); return; }
          usePersonalGithubUsage = input.usePersonalGithubUsage;
          sendJson(response, 204, undefined);
        } else if (request.method === "GET" && route === "/users/@me") {
          sendJson(response, 200, currentUser(mockManager));
        } else if (request.method === "GET" && route === "/notifications") {
          sendJson(response, 200, emptyNotifications);
        } else if (request.method === "POST" && route === "/notifications/read") {
          response.writeHead(204, { "Cache-Control": "no-store" });
          response.end();
        } else if (request.method === "GET" && route === "/group/emoji") {
          sendJson(response, 200, emptyGuildEmojis);
        } else {
          sendJson(response, 404, { message: `No mock handler for ${request.method} ${route}` });
        }
        } catch (error) {
          if (error instanceof MockRequestError) {
            sendJson(response, error.status, { message: error.message });
            return;
          }
          sendJson(response, error instanceof SyntaxError ? 400 : 500, { message: error instanceof SyntaxError ? "요청 형식을 확인해주세요." : "목업 요청 처리 중 오류가 발생했습니다." });
        }
      });
    },
  };
}
