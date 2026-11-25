import { Badge, Link } from "@chakra-ui/react";
import { ReactNode, useState } from "react";

import SimpleIcon from "../SimpleIcon";
import styles from "./style.module.css";

// 알려진 git 원격 저장소 호스팅 서비스의 호스트 → simple-icons slug. FileWindow(저장소 파일
// 창 헤더의 저장소 아이콘)에서도 같은 매핑을 쓰므로 export한다.
export const GIT_HOST_ICON_SLUG: Record<string, string> = {
  "github.com": "github",
  "gitlab.com": "gitlab",
  "bitbucket.org": "bitbucket",
  "gitea.com": "gitea",
  "gitea.io": "gitea",
  "codeberg.org": "codeberg",
  "gitee.com": "gitee",
  "gitcode.com": "gitcode",
  "atomgit.com": "atomgit",
  "sourceforge.net": "sourceforge",
  "sourcehut.org": "sourcehut",
  "git.sr.ht": "sourcehut",
  "launchpad.net": "launchpad",
};

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function getGitHostIconSlug(url: string): string | undefined {
  const parsed = parseUrl(url);
  return parsed ? GIT_HOST_ICON_SLUG[parsed.hostname.replace(/^www\./, "")] : undefined;
}

type Props = {
  url: string;
  trailingAction?: ReactNode;
  onEdit?: () => void;
};

/*
 * 저장소 주소의 호스트가 알려진 git 저장소 서비스면 서비스 아이콘 + 도메인 뒤 경로(사용자명/
 * 레포명 등)를 뱃지로 보여주고, 아니면 주소 그대로 보여준다. 아이콘 로딩이 최종 실패해도
 * 경로 텍스트는 그대로 남는다(TechBadge와 같은 폴백 방식).
 */
export default function GitRepoBadge({ url, trailingAction, onEdit }: Props) {
  const [iconFailed, setIconFailed] = useState(false);
  const parsed = parseUrl(url);
  const slug = parsed ? GIT_HOST_ICON_SLUG[parsed.hostname.replace(/^www\./, "")] : undefined;

  if (onEdit) {
    const path = parsed?.pathname.replace(/^\/+|\/+$/g, "");
    return (
      <Badge display="inline-flex" alignItems="center" gap="4px" size="sm" bg="blackAlpha.50" _hover={{ bg: "blackAlpha.100" }} maxW="100%" whiteSpace="normal" wordBreak="break-all" className={styles.editBadge}>
        <button type="button" className={styles.editButton} aria-label={`${url} 수정`} onClick={onEdit}>
          {slug && !iconFailed && <SimpleIcon slug={slug} size={16} onError={() => setIconFailed(true)} />}
          <span>{slug ? path : url}</span>
        </button>
        {trailingAction}
      </Badge>
    );
  }

  if (!parsed || !slug) {
    if (trailingAction) {
      return (
        <Badge display="inline-flex" alignItems="center" gap="4px" size="sm" bg="blackAlpha.50" whiteSpace="normal" wordBreak="break-all">
          <Link href={url} target="_blank" rel="noreferrer" color="var(--main-color)">{url}</Link>
          {trailingAction}
        </Badge>
      );
    }
    return (
      <Link href={url} target="_blank" rel="noreferrer" color="var(--main-color)">
        {url}
      </Link>
    );
  }

  const path = parsed.pathname.replace(/^\/+|\/+$/g, "");

  if (trailingAction) {
    return (
      <Badge display="inline-flex" alignItems="center" gap="4px" size="sm" bg="blackAlpha.50" whiteSpace="normal" wordBreak="break-all">
        <Link href={url} target="_blank" rel="noreferrer" display="inline-flex" alignItems="center" gap="4px" minW={0}>
          {!iconFailed && <SimpleIcon slug={slug} size={16} onError={() => setIconFailed(true)} />}
          {path}
        </Link>
        {trailingAction}
      </Badge>
    );
  }

  return (
    <Link href={url} target="_blank" rel="noreferrer">
      {/* Badge 기본값이 white-space: nowrap이라, 경로가 길면 줄바꿈 없이 폭을 그대로 늘려서
          280px 패널을 넘긴다 — wordBreak로 강제로 줄바꿈되게 한다 */}
      <Badge display="flex" alignItems="center" gap="4px" size="sm" bg="blackAlpha.50" whiteSpace="normal" wordBreak="break-all">
        {!iconFailed && <SimpleIcon slug={slug} size={16} onError={() => setIconFailed(true)} />}
        {path}
      </Badge>
    </Link>
  );
}
