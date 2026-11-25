import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "../../util/cn";
import styles from "./style.module.css";

type Props = {
  content: string;
  className?: string;
};

// 마크다운 문자열 하나를 받아 그대로 렌더링만 한다 — 입력(에디터)과는 무관해서 기록뷰어·
// 카드 설명 등 어디서든 재사용한다. react-markdown은 기본적으로 원본 HTML을 그대로 심지
// 않으므로(rehype-raw를 따로 안 붙이면) 사용자가 쓴 마크다운에 HTML을 섞어 넣어도 XSS로
// 이어지지 않는다.
export default function MarkdownViewer({ content, className }: Props) {
  return (
    <div className={cn(styles.body, className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 본문 링크가 앱 밖으로 나가면서 현재 보던 자리를 잃지 않게, 새 탭으로 연다.
          // rel="noreferrer"는 새 탭에 window.opener를 안 넘겨 리버스 태브내빙을 막는다.
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
