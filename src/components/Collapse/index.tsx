import { ReactNode } from "react";

import { cn } from "../../util/cn";
import styles from "./style.module.css";

type Props = {
  open: boolean;
  children: ReactNode;
};

// 열렸을 때만 내용을 그리는 대신 항상 mount해두고 CSS로 여닫아, 나타날 때뿐 아니라 사라질 때도
// 애니메이션이 재생되게 한다(조건부 렌더링은 unmount가 즉시 일어나 퇴장 애니메이션이 안 보인다).
export default function Collapse({ open, children }: Props) {
  return (
    <div className={cn(styles.collapse, open && styles.open)}>
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
