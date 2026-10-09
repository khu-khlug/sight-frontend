import { Badge } from "@chakra-ui/react";
import { ReactNode, useState } from "react";

import SimpleIcon from "../SimpleIcon";

type Props = {
  slug: string;
  trailingAction?: ReactNode;
};

/*
 * SimpleIcon이 slug의 SVG를 못 찾으면(jsDelivr·unpkg 둘 다 실패) 아이콘 없는 일반 뱃지로
 * 대체한다. 표시 텍스트는 SimpleIcon이 fetch로 얻어온 공식 이름(<title>)으로 바뀌기 전까지는
 * slug를 그대로 보여준다.
 */
export default function TechBadge({ slug, trailingAction }: Props) {
  const [label, setLabel] = useState(slug);
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <Badge display="flex" alignItems="center" gap="4px" size="sm" bg="blackAlpha.50" _hover={trailingAction ? { bg: "blackAlpha.100" } : undefined} transition="background-color 150ms ease" whiteSpace="normal" wordBreak="break-all">
      {!iconFailed && <SimpleIcon slug={slug} size={16} onLoad={setLabel} onError={() => setIconFailed(true)} />}
      {label}
      {trailingAction}
    </Badge>
  );
}
