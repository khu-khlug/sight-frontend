# 아이콘 뱃지: simple-icons 데이터를 CDN에서 직접 fetch해서 사용

## 배경

그룹 상세 페이지의 "정보" 탭(`GroupDetailContainer/tabs/GroupInfo`)에서 "사용 기술"과 "저장소" 항목을 기술 블로그·GitHub 등에서 흔히 쓰는 형태처럼, 각 이름에 해당하는 로고 뱃지로 보여주고 싶다.

그룹 생성/수정 시 사용자가 기술명을 자유 텍스트로 입력하므로(예: "리액트", "React", "react.js", "REACT" 등 다양한 표기), 저장된 텍스트에서 적절한 뱃지를 찾아 매칭하는 기능이 필요하다.

추가로, 인스타 등 SNS 뱃지나 깃허브 뱃지 등 다른 페이지에서도 사용할 수 있는 커버리지 높은 데이터 소스가 필요하다.

## 검토한 후보

아이콘과 글씨가 함께 이미지로 제공되는 완성형 뱃지 라이브러리는 스타일 커스텀이 어려워 제외했다.

| 후보 | 형태 |
|---|---|
| `simple-icons` (raw) | SVG + JSON 메타데이터, React 컴포넌트 아님 |
| `@icons-pack/react-simple-icons` | simple-icons를 감싼 React 컴포넌트 |
| `devicon` | 폰트/SVG, 언어·개발도구 중심, React 생태계 얇음 |
| `react-icons` (si/di 팩) | 여러 아이콘팩을 벤더링해 통합 제공 |
| `@iconify/react` | 200+ 아이콘셋을 온디맨드 로딩으로 통합 제공 |
| `skillicons.dev`, `shields.io` | URL 기반 외부 이미지 서비스, npm 패키지 아님 |

비교 기준: 번들 크기, 안정성/유지보수 활발도, 신규 기술 로고 추가 속도, 자유 텍스트 → 뱃지 매칭에 쓸 수 있는 메타데이터(별칭 등)의 질.

simple-icons는 3,453개 브랜드 아이콘을 보유하고 매주 새 아이콘을 릴리스한다(GitHub 스타 22,486, 주간 다운로드 78만+, "Sustainable" 평가). `devicon`은 언어·개발도구 위주라 브랜드 전반을 다루지 못하고, `skillicons.dev`는 약 190개로 커버리지가 더 좁다. 이 커버리지·갱신 속도 때문에 데이터 소스는 simple-icons로 정했다.

## 결정: npm 패키지 대신 CDN에서 slug로 직접 fetch

`@icons-pack/react-simple-icons`(+ `simple-icons` 데이터)를 npm 의존성으로 설치해 번들에 올리는 방식을 먼저 구현했으나, 그룹 상세 페이지를 열 때만 로드되는 청크가 gzip 기준 **2.2MB**에 달하는 걸 실측으로 확인했다. 3,453개 브랜드 전체의 SVG path 데이터를 담아야 하는 게 구조적인 무게라, 어떤 npm 패키지를 쓰든 비슷한 크기가 나온다.

대신 **npm 패키지를 설치하지 않고, jsDelivr/unpkg CDN에서 slug로 SVG를 직접 fetch**하는 방식으로 바꿨다. simple-icons 프로젝트 자체가 자체 API 서버 없이 jsDelivr/unpkg 같은 npm CDN을 공식 배포 경로로 안내하므로(`https://cdn.jsdelivr.net/npm/simple-icons@{version}/icons/{slug}.svg`), 이게 사실상 "simple-icons의 원본 배포 방식"이다.

- **`components/SimpleIcon`**: slug로 jsDelivr에서 SVG를 텍스트로 fetch하고, 실패하면 unpkg로 재시도한다. 응답 안의 `<title>` 태그에서 공식 이름(예: "Spring Boot")을 파싱해 `onLoad`로 알리고, SVG 내용은 inline `<svg>`로 렌더링한다(`<img src>` 방식이 아니다 — fetch 한 번으로 아이콘과 이름을 동시에 얻기 위함). 둘 다 실패하면 아무것도 그리지 않고 `onError`로 알린다.
- **`components/TechBadge`**: `SimpleIcon`을 감싸 아이콘+이름 뱃지를 만들고, 아이콘 로딩이 실패하면 slug 텍스트만 있는 일반 뱃지로 대체한다. "사용 기술" 항목에서 쓴다.
- **`components/GitRepoBadge`**: 저장소 URL의 호스트가 알려진 git 저장소 서비스(github.com, gitlab.com 등)와 일치하면 `TechBadge`와 같은 방식으로 서비스 아이콘 + 저장소 경로를 보여주고, 아니면 URL 그대로 보여준다. 호스트 → slug 매핑은 자유 텍스트 매칭이 아니라 알려진 서비스 몇 개짜리 고정 테이블이라 별도 매칭 로직이 필요 없다.

simple-icons SVG 원본은 fill이 없는 실루엣이라, 브랜드색을 칠하지 않아도(칠하지 않을수록) 아이콘마다 채도·명도가 들쭉날쭉해지는 문제가 없다 — 별도 처리 없이 `currentColor`로 일관된 실루엣이 된다.

### CDN 폴백: jsDelivr 우선, unpkg 폴백

두 CDN 모두 같은 npm 패키지를 미러링하므로 내용은 동일하다. 하나가 장애 나거나 특정 slug 파일이 일시적으로 안 뜰 때를 대비해 jsDelivr가 실패하면 unpkg로, 그것도 실패하면 아이콘 없는 일반 뱃지로 넘어간다.

## 남는 과제

- **자유 텍스트 → slug 매칭**: "한글/영문/대소문자 혼용 자유 텍스트 → 정확한 뱃지 슬러그" 매칭을 자동으로 해주는 라이브러리는 없다. simple-icons의 `title`/`slug`/`aliases`만으로는 한국어 표기(예: "리액트") 대응 근거를 찾지 못했으므로, 한국어 별칭 매핑 테이블이 별도로 필요하다. 이 매칭은 프론트가 아니라 **Backend가 그룹 생성/수정 시점에 수행**해 `techStack`에 slug 배열로 반환하는 것으로 범위를 잡았다(`tabs/GroupInfo/types.ts`의 `techStack: string[]` 주석 참고).
