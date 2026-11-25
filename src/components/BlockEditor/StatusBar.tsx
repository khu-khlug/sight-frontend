import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { memo } from "react";

import styles from "./style.module.css";

// 글자 수·단어 수는 글자마다 바뀌므로, 이 값을 구독하는 컴포넌트를 상태바 하나로 한정해
// 입력할 때 다시 그려지는 범위를 여기까지만 둔다.
function StatusBar({ editor }: { editor: Editor }) {
  const counts = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      characters: current.storage.characterCount?.characters() ?? current.getText().length,
      words: current.storage.characterCount?.words() ?? 0,
    }),
  });

  return (
    <div className={styles.statusBar}>
      {/* TODO: 실시간 협업 기능이 추가되면 해당 기록을 같이 편집 중인 멤버 이름들을 여기(좌측)에 표시한다. 커서색과 이름색(혹은 이름뱃지를 쓴다면 뱃지의 바탕색)을 통일한다.*/}
      <div className={styles.statusBarLeft} />
      <div className={styles.statusBarRight}>
        <span>{counts.characters}자</span>
        <span>{counts.words}단어</span>
      </div>
    </div>
  );
}

export default memo(StatusBar);
