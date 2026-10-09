import { ComponentProps, lazy, Suspense } from "react";

import ContentSkeleton from "../../../components/ContentSkeleton";
import type { RecordType } from "../../../api/public/group/KanbanApi";

// 에디터 계열(tiptap, prosemirror, katex, highlight.js)이 첫 화면 번들에 들어가지 않도록 뷰어가
// 처음 그려질 때 불러온다. 기록을 보여주는 곳이 여럿이라 지연 로딩과 로딩 표시를 여기 한 곳에 둔다.
const BlockViewer = lazy(() => import("../../../components/BlockViewer"));
const LegacyViewer = lazy(() => import("../../../components/LegacyViewer"));

type Props = ComponentProps<typeof BlockViewer> & { type: RecordType };

export default function RecordViewer({ type, ...props }: Props) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      {type === "legacy" ? <LegacyViewer content={props.content} className={props.className} /> : <BlockViewer {...props} />}
    </Suspense>
  );
}
