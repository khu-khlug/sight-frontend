--쓸것--
- Document	  문서 전체의 최상위 구조를 담당하는 필수 확장입니다.
- Paragraph	  일반 문단을 만듭니다.
- Text	      문서에서 일반 텍스트를 사용할 수 있게 하는 기본 확장입니다.
- Undo/Redo	  편집 기록을 관리하여 변경 사항을 실행 취소하거나 다시 실행할 수 있게 합니다.
- 블록 드래그 핸들	공식 Drag Handle 대신 직접 만든 핸들을 쓴다(아래 "결정기록: 블록 핸들" 참고).
- Dropcursor	콘텐츠를 드래그할 때 삽입될 위치에 커서를 표시합니다.
- Selection	  에디터가 포커스를 잃어도 텍스트 선택 영역을 유지합니다.

- Text Style	다른 스타일 확장에서 사용하는 인라인 <span> 요소를 제공합니다. 단독으로는 별다른 기능이 없습니다.
- Text Align	텍스트를 왼쪽, 가운데, 오른쪽 등으로 정렬합니다.
- Heading	    최대 6단계의 제목으로 문서 구조를 구성합니다.
- Bold	      텍스트를 굵게 표시합니다.
- Code	      문장 안에 인라인 코드를 표시합니다.
- Color	      텍스트 색상을 설정합니다.
- Highlight	  텍스트에 하이라이트를 적용합니다.
- Background Color	텍스트 배경색을 설정합니다. 별도 패키지가 아니라 @tiptap/extension-text-style에서 BackgroundColor로 함께 export된다(설치는 Text Style 하나로 끝).
- Italic	    텍스트를 기울임꼴로 표시합니다.
- Link	      텍스트에 링크를 추가합니다.
- Strike	    텍스트에 취소선을 적용합니다.
- Subscript	  아래첨자를 표시합니다.
- Superscript	위첨자를 표시합니다.
- Underline	  텍스트에 밑줄을 적용합니다.
- Hard break	문단을 나누지 않고 줄바꿈을 삽입합니다.

- Emoji	        이모지를 인라인 노드로 렌더링하며, 지원되지 않는 이모지는 대체 이미지로 표시합니다.
- CodeBlock Lowlight	코드 블록에 구문 강조(syntax highlighting)를 추가합니다.
- Blockquote	  다른 사람의 말을 인용하는 인용문 블록입니다.
- Mathematics	  LaTeX를 이용해 수식을 작성하고 표시할 수 있게 합니다.

- BulletList	  글머리 기호 목록을 만듭니다.
- Ordered List	번호가 매겨진 목록을 만듭니다.
- List Item	    글머리 기호 목록이나 번호 목록을 구성하는 개별 항목입니다.
- Task Item	    체크리스트를 구성하는 개별 작업 항목입니다.
- Task List	    체크 가능한 작업 목록을 추가합니다.

- TableKit	    표에 필요한 여러 확장을 하나로 묶어 제공합니다.
  - Table	        문서에  표를 추가합니다.
  - Table Cell	  표의 일반 셀입니다.
  - Table Header	표의 헤더 셀입니다.
  - Table Row	    표의 행입니다.

- Details	        접고 펼칠 수 있는 상세 정보 노드를 추가합니다.
- DetailsContent	Details 노드의 본문 내용을 추가합니다.
- DetailsSummary	Details 노드의 요약/제목 부분을 추가합니다.

- Audio	  오디오 파일을 문서에 직접 삽입합니다.
- Image	  문서에 이미지를 삽입합니다.

- Horizontal Rule	    가로 구분선을 삽입합니다.

- Character Count	      문자 수를 세거나 최대 문자 수를 제한합니다. 툴바가 아니라 에디터 하단 상태표시줄에 둔다.
- Invisible Characters	공백, 강제 줄바꿈, 문단 등의 보이지 않는 문자를 표시합니다. 툴바 토글 버튼으로 둔다.
- Find and Replace	    에디터의 텍스트를 검색하고 강조하고 이동하며 치환합니다.
- Placeholder	          비어 있는 에디터에 안내 문구를 표시합니다.


--결정기록: 슬래시 명령--
- @tiptap/suggestion으로 만든다(BlockEditor/slashCommand.ts, 목록 UI는 SlashMenu.tsx).
- 줄 맨 앞의 "/"에서만 동작한다. "/" 뒤 글자가 입력 순서대로 나타나는 항목을 남기고(초성, 받침을 치기 전·다음 글자로
  넘어가기 전의 입력 중인 글자 포함, util/koreanMatch.ts), 앞부분 일치 → 중간 연속 일치 → 순서만 일치 순으로 보인다. 영어 검색은 하지 않는다.
- 항목: 체크리스트, 아코디언, 인용, 수식(블록), 코드(블록), 표, 이미지, 오디오, 비디오, 파일. 목차는 넣지 않는다(툴바 토글로만).
- ↑/↓로 고르고 Tab 또는 Enter로 넣는다. Esc로 닫는다. 넣는 동작은 툴바 버튼과 같은 함수(blockCommands.ts 등)를 쓴다.


--애매(일단 제외)--
- Bubble Menu	텍스트 선택 시 그 위에 나타나는 툴바를 추가합니다. 인라인 서식을 적용할 때 유용합니다.
- Floating Menu	빈 줄 등에서 자동으로 나타나는 툴바를 제공합니다.
- Focus	현재 커서/포커스가 위치한 노드를 추적하고 시각적으로 표시할 수 있게 합니다.


--추후확장시--
- Mention	자동완성 팝업을 이용해 다른 사용자를 멘션하고 렌더링 방식을 제어합니다.
- AI Toolkit	AI 에이전트가 문서를 읽고, 편집하고, 조작할 수 있도록 기본 도구를 제공합니다.
- Collaboration	여러 사용자가 동시에 문서를 공동 편집할 수 있게 합니다.
- Collaboration Caret	공동 편집 중 다른 사용자의 커서와 이름을 표시합니다.
- Tracked Changes	공동 편집 및 문서 검토를 위한 변경 제안 모드를 제공합니다.

--안쓸것--
- Ruby Text	  HTML Ruby annotation을 이용해 후리가나 등의 읽기 표기를 추가합니다.
- Basic AI Generation	AI를 이용한 텍스트 및 콘텐츠 생성을 에디터에 통합합니다.
- Comments	공동 문서에 댓글 및 토론 기능을 추가합니다.
- Import	DOCX, ODT 또는 Markdown 문서를 Tiptap으로 가져옵니다.
- Export	Tiptap 콘텐츠를 DOCX, ODT 또는 Markdown으로 내보냅니다.
- Twitch	Twitch 영상을 문서에 삽입합니다.
- Paste Handler	Excel, Word, Google Docs 등 외부 프로그램에서 붙여넣은 콘텐츠를 자동으로 정리하고 정규화합니다.
- List Keymap	키보드 사용 시 목록을 좀 더 자연스럽게 편집할 수 있도록 동작을 보완합니다.
- Font Family	텍스트의 글꼴을 설정합니다.
- Font Size	텍스트의 글자 크기를 설정합니다.
- Line Height	텍스트의 줄 높이/줄 간격을 설정합니다.
- Pages	에디터를 여백과 페이지 나누기가 있는 페이지 기반 문서 인터페이스로 만듭니다.
- Drag Handle Vue	Vue 기반 에디터용 노드 드래그 핸들입니다.
- Snapshot	수동 및 자동 버전 관리를 위한 문서 버전 기록 기능을 제공합니다.
- Compare Snapshots	서로 다른 두 문서 버전의 스냅샷을 비교하여 변경 사항을 확인합니다.
- Gapcursor	일반적인 커서를 둘 수 없는 블록 사이에도 커서를 위치시킬 수 있게 합니다.
- Trailing Node	문서의 마지막 블록 뒤에 지정된 노드가 존재하도록 합니다.
- Typography	따옴표, 대시 등 텍스트의 타이포그래피를 자동으로 다듬습니다.
- UniqueID	각 노드에 고유 ID를 부여하여 개별 노드를 추적할 수 있게 합니다.


--결정기록: 블록 핸들(Drag Handle)--
- 배경: 블록 단위로 끌어서 순서를 바꾸는 핸들이 필요하다.
- 채택: 직접 만든 핸들(BlockEditor/withDragHandle.ts, pointerDrag.ts, handlePolicy.ts). 블록 노드의 NodeView를 [핸들 + 블록]
  래퍼로 감싸고, 포인터 이동으로 블록을 옮긴다(휠 입력을 받기 위해 HTML 드래그는 쓰지 않는다).
- 공식 @tiptap/extension-drag-handle(-react)과 그 peer dependency(@tiptap/extension-node-range, @tiptap/extension-collaboration,
  @tiptap/y-tiptap, yjs, y-protocols)는 설치하지 않는다.
- 검토한 대안: tiptap-extension-global-drag-handle(v3 지원 불명), @tiptap-codeless/extension-drag-handle(React 19 필요), @vueditor/tiptap-extension-handle(Tiptap 2 전용), tiptap-drag-handle-extension(Vue 3 전용).  
  모두 성숙도·호환 문제로 채택하지 않았다.  
- 적용 범위: BlockEditor 안에서만 쓴다. BlockEditor는 기록 작성창에서 React.lazy로 불러오므로 첫 화면 번들에 들어가지 않는다. nested로 인용·목록·아코디언 안의 블록도 끌 수 있다.

--결정기록: 미디어·파일 삽입--
- 채택: 공식 File Handler 대신 BlockEditor/mediaInput의 입력 박스(커스텀 노드)로 구현한다.
- 이유: URL 입력·파일 선택·붙여넣기·OS 파일 드롭·앱 안 파일(저장소·활동보고서·채팅 첨부) 드래그를 한 경로로 처리하고,
  업로드 진행·오류를 그 자리에 보여주며 업로드 중 보내기를 막아야 한다.
- 이미지·오디오·동영상이 아닌 파일은 BlockContent/FileAttachment 노드(확장자 아이콘·파일명·용량·다운로드)로 넣는다.
- 동영상은 세 경우만 지원한다: 유튜브 주소(Youtube 확장, iframe), 직접 올린 파일, 동영상 파일을 직접 가리키는 주소
  (둘 다 BlockContent/Video 노드, <video>). Youtube 확장은 유튜브 도메인만 받고 임베드 주소로 바꿔 iframe에 넣으므로
  다른 동영상 사이트의 페이지 주소는 지원하지 않는다. 용량 제한을 넘는 동영상은 유튜브에 올린 뒤 링크를 넣도록 안내한다.

--결정기록: 목차--
- 채택: 공식 Table of contents 대신 커스텀 블록(BlockContent/TableOfContents)으로 만든다. 공식 확장은 제목 기반 목차 "데이터"만
  주고, 문서에 하나만 두는 삽입형 블록 UI는 없다.
- 툴바 버튼은 토글이다. 문서에 하나만 존재하고, 기본 위치는 기록 맨 앞이다. 같은 편집 중에 끄고 다시 켜면 끄기 직전 위치에
  나타난다(그 위치는 편집기 메모리에만 두고 저장하지 않는다). 둘 이상이 되면(붙여넣기 등) 앞의 것만 남긴다.
- 저장되는 HTML은 자리 표시(<nav data-type="toc">)뿐이고, 항목은 그릴 때마다 그 문서의 제목들로 만든다.
- 계층: 글자가 없는 제목은 빼고, 각 제목의 부모는 앞쪽에서 가장 가까운 자신보다 큰(레벨 숫자가 작은) 제목이다. 없으면 최상위.
  접는 블록·인용·목록 안의 제목도 포함한다. 번호는 붙이지 않는다.
- 표시: 맨 위에 "목차" 제목 줄을 둔다. 최상위는 선 없이, 그 아래는 부모 글자 시작 열에 ├─/└─를 둔다. 줄바꿈된 제목은 첫 줄
  글자 시작 위치에 맞춘다. 박스 글자의 세로선이 끊겨 보이지 않도록 줄 높이를 본문보다 좁게 둔다.
- 뷰어에서 항목을 누르면 접힌 블록을 펼치고 그 제목으로 스크롤한다. 편집기에서는 이동하지 않고, 로컬 임시저장 디바운스가
  끝날 때 그동안 제목이 바뀌었으면 다시 그린다.
