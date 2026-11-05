export function discordChannelUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.origin !== "https://discord.com" || !/^\/channels\/\d+\/\d+\/?$/.test(url.pathname)) return null;
    return `${url.origin}${url.pathname}`;
  } catch { return null; }
}

// 클릭 시 탭을 먼저 확보해 지연된 웹 전환이 팝업 차단에 걸리지 않도록 한다.
export function openDiscordChannel(webUrl: string): boolean {
  const url = discordChannelUrl(webUrl);
  if (!url) return false;
  const launchTab = window.open("about:blank", "_blank");
  if (!launchTab) return false;
  launchTab.opener = null;
  launchTab.document.title = "Discord 열기";
  launchTab.document.documentElement.lang = "ko";
  const message = launchTab.document.createElement("p");
  message.textContent = "Discord 앱을 여는 중입니다. 앱이 열리지 않으면 웹으로 이동합니다.";
  const webLink = launchTab.document.createElement("a");
  webLink.href = url;
  webLink.textContent = "Discord 웹에서 열기";
  webLink.rel = "noreferrer";
  launchTab.document.body.append(message, webLink);

  const cleanup = () => {
    window.clearTimeout(timer);
    launchTab.document.removeEventListener("visibilitychange", handleVisibility);
    launchTab.removeEventListener("pagehide", cleanup);
  };
  const handleVisibility = () => {
    if (launchTab.document.visibilityState === "hidden") {
      cleanup();
      launchTab.close();
    }
  };
  const timer = window.setTimeout(() => {
    if (launchTab.closed) return;
    cleanup();
    launchTab.location.replace(url);
  }, 2000);
  launchTab.document.addEventListener("visibilitychange", handleVisibility);
  launchTab.addEventListener("pagehide", cleanup);
  try {
    launchTab.location.href = url.replace("https:", "discord:");
  } catch {
    cleanup();
    launchTab.location.replace(url);
  }
  return true;
}
