# 파일 종류 아이콘: Material Icon Theme SVG를 CDN에서 사용

## 배경

그룹 페이지의 저장소 탭은 파일 종류와 관계없이 같은 일반 파일 아이콘을 보여준다. 활동 공개 탭은 별도의 Lucide 확장자 매핑을 사용한다. 두 탭에서 확장자와 일부 고유 파일명을 같은 아이콘으로 구분하되, 알려지지 않은 파일도 기존처럼 읽을 수 있어야 한다. PowerPoint(`.ppt`, `.pptx`)를 포함한 문서 파일과 소스 파일을 함께 다룬다.

## 검토한 후보

| 후보 | 판단 |
|---|---|
| [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) | 파일·폴더 SVG와 파일명·확장자 매핑을 제공한다. `powerpoint.svg`가 있고 저장소는 MIT 라이선스다. |
| [VSCode Icons](https://github.com/vscode-icons/vscode-icons) | PowerPoint를 포함해 종류가 많지만, 원본 저장소는 코드에 MIT, 아이콘에 CC BY-SA, 브랜드 아이콘에 별도 권리를 명시한다. |
| [Devicon](https://github.com/devicons/devicon) | 언어·개발 도구 로고에 집중해 일반 문서 파일을 구분하기에는 부족하다. |

파일 트리에서 필요한 문서·소스 파일 범위와 라이선스 조건을 고려해 **Material Icon Theme**를 선택한다. 이 결정은 SVG 자산 사용에 관한 것이며, 브랜드 로고의 상표권까지 보장한다는 뜻은 아니다.

## 결정: 버전을 고정한 CDN SVG와 두 단계 폴백

전체 아이콘 팩을 번들에 넣지 않는다. 공통 `MaterialFileIcon` 컴포넌트에서 파일명·확장자를 로컬 매핑으로 아이콘 이름에 대응시키고, 필요한 SVG만 `material-icon-theme@5.38.1`의 jsDelivr URL에서 불러온다. 연결 실패나 서버 오류(5xx)일 때만 같은 버전의 unpkg URL로 재시도한다. 자산 없음(404)을 포함한 클라이언트 오류(4xx)는 CDN을 바꾸지 않고 바로 기존 Lucide `File` 아이콘을 보여준다. 두 CDN 모두 실패하거나 매핑되지 않은 파일도 `File`을 사용한다.

- 기본 URL: `https://cdn.jsdelivr.net/npm/material-icon-theme@5.38.1/icons/{icon}.svg`
- 폴백 URL: `https://unpkg.com/material-icon-theme@5.38.1/icons/{icon}.svg`
- 예: `.ppt`/`.pptx` → [`powerpoint.svg`](https://cdn.jsdelivr.net/npm/material-icon-theme@5.38.1/icons/powerpoint.svg)

`components/SimpleIcon`의 jsDelivr → unpkg 흐름을 따른다. `<img>`의 오류 이벤트만으로는 HTTP 상태를 구분할 수 없어 `fetch`로 응답을 확인하고, 성공한 SVG만 이미지로 표시한다. 아이콘은 장식 요소로 숨기고 파일명 또는 활동보고의 파일 링크를 그대로 유지한다. 아이콘의 고유 색도 원본 SVG대로 표시한다.

파일명 우선 매핑을 두어 `README.md`, `Dockerfile`, `*.d.ts` 같은 경우를 일반 확장자보다 먼저 처리한다. 모든 아이콘 이름은 사용 중인 패키지 버전의 [아이콘 목록](https://cdn.jsdelivr.net/npm/material-icon-theme@5.38.1/icons/)에 있는 자산을 기준으로 한다. 새 확장자를 지원할 때는 매핑과 해당 버전의 SVG 존재 여부를 함께 확인한다.
