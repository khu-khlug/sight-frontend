import apiV2Client from "./v2";

// app.khlug.org는 Cloudflare Pages, api-v2.khlug.org는 Caddy를 거치는 별도 호스트다.
// Pages에는 /groups/.../files/...를 API로 전달하는 프록시가 없으므로, 상대 파일 주소를
// 그대로 사용하면 프런트 서버로 요청된다. 영구주소의 경로는 유지하면서 API 기본주소로 해석한다.
// 그룹 API의 경로는 v2 기준이며, 레거시 파일과 /api 경로는 서버 루트 기준이다.
export function resolveApiUrl(value: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("//")) return value;
  const base = new URL(apiV2Client.defaults.baseURL || "/", window.location.origin);
  const basePath = base.pathname.replace(/\/$/, "");
  if ((basePath && value.startsWith(`${basePath}/`)) || /^\/(image|file|api)\//.test(value)) return new URL(value, base.origin).href;
  return new URL(value.replace(/^\/+/, ""), `${base.href.replace(/\/$/, "")}/`).href;
}

export function apiFileCredentials(value: string): RequestCredentials {
  const base = new URL(apiV2Client.defaults.baseURL || "/", window.location.origin);
  return new URL(resolveApiUrl(value), window.location.origin).origin === base.origin ? "include" : "omit";
}
