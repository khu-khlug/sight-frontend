import { File } from "lucide-react";
import { useEffect, useState } from "react";

const VERSION = "5.38.1";
const ICON_BASE = `material-icon-theme@${VERSION}/icons`;

const EXTENSION_ICONS: Record<string, string> = {
  "7z": "zip",
  c: "c",
  cpp: "cpp",
  css: "css",
  csv: "table",
  doc: "word",
  docx: "word",
  gif: "image",
  go: "go",
  html: "html",
  hwp: "document",
  java: "java",
  jpeg: "image",
  jpg: "image",
  js: "javascript",
  json: "json",
  jsx: "react",
  key: "powerpoint",
  md: "markdown",
  pdf: "pdf",
  png: "image",
  ppt: "powerpoint",
  pptm: "powerpoint",
  pptx: "powerpoint",
  py: "python",
  rar: "zip",
  svg: "svg",
  toml: "toml",
  ts: "typescript",
  tsx: "react_ts",
  txt: "document",
  webp: "image",
  xls: "table",
  xlsx: "table",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zip: "zip",
};

const FILE_NAME_ICONS: Record<string, string> = {
  dockerfile: "docker",
  "readme.md": "readme",
};

function iconNameForFile(fileUrlOrName: string): string | null {
  const path = fileUrlOrName.split(/[?#]/, 1)[0];
  const name = path.split(/[\\/]/).pop()?.toLowerCase() ?? "";
  if (name.endsWith(".d.ts")) return "typescript-def";
  if (FILE_NAME_ICONS[name]) return FILE_NAME_ICONS[name];
  const extension = name.split(".").pop() ?? "";
  return EXTENSION_ICONS[extension] ?? null;
}

async function fetchIcon(iconName: string): Promise<Blob | null> {
  const urls = [
    `https://cdn.jsdelivr.net/npm/${ICON_BASE}/${iconName}.svg`,
    `https://unpkg.com/${ICON_BASE}/${iconName}.svg`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      // 없는 자산 등 클라이언트 오류는 다른 CDN에서도 동일하므로 재시도하지 않는다.
      if (response.status >= 400 && response.status < 500) return null;
      if (!response.ok) continue;

      const svg = await response.text();
      const document = new DOMParser().parseFromString(svg, "image/svg+xml");
      if (document.documentElement.localName !== "svg" || document.querySelector("parsererror")) {
        return null;
      }
      return new Blob([svg], { type: "image/svg+xml" });
    } catch {
      // CDN 연결 또는 응답 읽기 실패 시 다음 CDN을 시도한다.
    }
  }
  return null;
}

function RemoteIcon({ iconName, size }: { iconName: string; size: number }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    fetchIcon(iconName).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [iconName]);

  if (!imageUrl) return <File size={size} aria-hidden="true" />;

  return (
    <img
      src={imageUrl}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ flex: "none", objectFit: "contain" }}
      onError={() => setImageUrl(null)}
    />
  );
}

export default function MaterialFileIcon({ fileName, size = 16 }: { fileName: string; size?: number }) {
  const iconName = iconNameForFile(fileName);
  if (!iconName) return <File size={size} aria-hidden="true" />;

  return <RemoteIcon key={iconName} iconName={iconName} size={size} />;
}
