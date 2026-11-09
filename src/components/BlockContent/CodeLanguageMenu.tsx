import { Menu, Portal } from "@chakra-ui/react";
import { Check, ChevronDown, Code, FileText, Sparkles } from "lucide-react";
import { useState } from "react";

import { VerticalScrollBox } from "../ScrollBox";
import SimpleIcon from "../SimpleIcon";
import styles from "./codeBlock.module.css";

// lowlight의 언어 식별자를 Simple Icons slug와 표시 이름에 연결한다.
// 아이콘이 없거나 CDN 로딩이 실패한 언어는 공통 코드 아이콘으로 표시한다.
const LANGUAGE_INFO: Record<string, { label: string; slug?: string }> = {
  arduino: { label: "Arduino", slug: "arduino" },
  bash: { label: "Bash", slug: "gnubash" },
  c: { label: "C", slug: "c" },
  cpp: { label: "C++", slug: "cplusplus" },
  csharp: { label: "C#", slug: "csharp" },
  css: { label: "CSS", slug: "css" },
  diff: { label: "Diff" },
  go: { label: "Go", slug: "go" },
  graphql: { label: "GraphQL", slug: "graphql" },
  ini: { label: "INI" },
  java: { label: "Java", slug: "openjdk" },
  javascript: { label: "JavaScript", slug: "javascript" },
  json: { label: "JSON", slug: "json" },
  kotlin: { label: "Kotlin", slug: "kotlin" },
  less: { label: "Less", slug: "less" },
  lua: { label: "Lua", slug: "lua" },
  makefile: { label: "Makefile", slug: "gnu" },
  markdown: { label: "Markdown", slug: "markdown" },
  objectivec: { label: "Objective-C" },
  perl: { label: "Perl", slug: "perl" },
  php: { label: "PHP", slug: "php" },
  "php-template": { label: "PHP Template", slug: "php" },
  plaintext: { label: "일반 텍스트" },
  python: { label: "Python", slug: "python" },
  "python-repl": { label: "Python REPL", slug: "python" },
  r: { label: "R", slug: "r" },
  ruby: { label: "Ruby", slug: "ruby" },
  rust: { label: "Rust", slug: "rust" },
  scss: { label: "SCSS", slug: "sass" },
  shell: { label: "Shell", slug: "gnubash" },
  sql: { label: "SQL" },
  swift: { label: "Swift", slug: "swift" },
  typescript: { label: "TypeScript", slug: "typescript" },
  vbnet: { label: "Visual Basic .NET", slug: "dotnet" },
  wasm: { label: "WebAssembly", slug: "webassembly" },
  xml: { label: "XML / HTML", slug: "html5" },
  yaml: { label: "YAML", slug: "yaml" },
};

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  py: "python", rb: "ruby", rs: "rust", sh: "bash", html: "xml", yml: "yaml",
  cs: "csharp", "c++": "cpp", "c#": "csharp", text: "plaintext", txt: "plaintext",
};

function languageInfo(language: string) {
  return LANGUAGE_INFO[LANGUAGE_ALIASES[language] ?? language] ?? { label: language };
}

function LanguageIcon({ language }: { language: string | null }) {
  const slug = language ? languageInfo(language).slug : undefined;
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const [failedSlug, setFailedSlug] = useState<string | null>(null);
  const Fallback = !language ? Sparkles : language === "plaintext" ? FileText : Code;

  return (
    <span className={styles.languageIcon}>
      {(!slug || loadedSlug !== slug || failedSlug === slug) && <Fallback size={16} />}
      {slug && failedSlug !== slug && (
        <SimpleIcon
          slug={slug}
          size={16}
          colored
          onLoad={() => setLoadedSlug(slug)}
          onError={() => setFailedSlug(slug)}
        />
      )}
    </span>
  );
}

export function CodeLanguageLabel({ language, detectedLanguage }: { language: string | null; detectedLanguage: string | null }) {
  const displayedLanguage = language ?? detectedLanguage;
  const label = language
    ? languageInfo(language).label
    : `자동 감지 · ${detectedLanguage ? languageInfo(detectedLanguage).label : "감지되지 않음"}`;
  return (
    <span className={styles.languageLabel}>
      <LanguageIcon key={displayedLanguage ?? "auto"} language={displayedLanguage} />
      <span>{label}</span>
    </span>
  );
}

type Props = {
  language: string | null;
  detectedLanguage: string | null;
  languages: string[];
  onSelect: (language: string | null) => void;
};

export default function CodeLanguageMenu({ language, detectedLanguage, languages, onSelect }: Props) {
  const choices = Array.from(new Set(["plaintext", ...languages, ...(language ? [language] : [])]))
    .filter((name) => name !== "plaintext")
    .sort((left, right) => languageInfo(left).label.localeCompare(languageInfo(right).label));

  return (
    <Menu.Root
      lazyMount
      unmountOnExit
      positioning={{ placement: "bottom-start" }}
      onSelect={({ value }) => onSelect(value === "__auto__" ? null : value)}
    >
      <Menu.Trigger asChild>
        <button type="button" className={styles.languageTrigger} aria-label="코드블록 언어 선택">
          <CodeLanguageLabel language={language} detectedLanguage={detectedLanguage} />
          <ChevronDown size={14} />
        </button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className={styles.languageMenu} aria-label="코드블록 언어">
            <VerticalScrollBox gutter={4}>
              <Menu.Item value="__auto__" className={styles.languageOption}>
                <CodeLanguageLabel language={null} detectedLanguage={detectedLanguage} />
                {!language && <Check size={14} />}
              </Menu.Item>
              {["plaintext", ...choices].map((name) => (
                <Menu.Item key={name} value={name} className={styles.languageOption}>
                  <CodeLanguageLabel language={name} detectedLanguage={null} />
                  {language === name && <Check size={14} />}
                </Menu.Item>
              ))}
            </VerticalScrollBox>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
