# 그룹 페이지 개발 안내

쿠러그 SIGHT의 그룹 페이지를 개발하고 동작을 체험하기 위한 안내입니다. 목업과 개발 도구를 유지하는 `dev/group-page`를 기준으로 설명하며, `feat/group-page`로 머지한 뒤 PR을 준비할 때 정리할 항목도 포함합니다.

## 브랜치 운영

| 브랜치 | 용도 |
| --- | --- |
| `dev/group-page` | 그룹 페이지 개발용. Vite 목업 서버, 샘플 데이터, 개발 탭을 유지합니다. |
| `feat/group-page` | PR 준비용. 개발 브랜치를 일반 머지한 뒤 목업과 개발 전용 코드를 제거하고 실제 백엔드에 연결합니다. |

개발용 코드는 개발 브랜치에서 유지합니다. 피처 브랜치의 정리 커밋을 개발 브랜치에 그대로 합쳐 목업을 제거하지 않도록 주의합니다. 피처 브랜치에 머지했다는 사실만으로 개발 코드가 제거되는 것은 아닙니다.

### 주기적인 개발·배포·확인 사이클

이 과정은 한 번의 PR로 끝나지 않고 주기적으로 반복합니다.

1. `dev/group-page`에서 목업으로 개발하고 동작을 확인합니다.
2. 개발 변경을 `feat/group-page`로 일반 머지하고 목업·개발 전용 코드를 정리한 뒤 PR을 올립니다.
3. 피처 변경이 `main`에 머지되어 배포되면 `/dev/group/<실제 그룹 ID>`에 접속하여 실제 백엔드와 실제 데이터로 동작을 확인합니다. 이때는 실제 로그인과 해당 그룹에 대한 접근 권한이 필요합니다.
4. 확인 중 발견한 문제는 `dev/group-page`에서 수정합니다.
5. 수정 사항을 다시 피처 브랜치로 머지하고 PR을 올려 배포·확인을 반복합니다.

그룹 페이지는 이 기간 동안 배포 후에도 `/dev/group/:groupId` 경로를 유지합니다. 기존 프로덕션의 그룹 화면과 진입 경로를 대체하지 않은 채 새 화면을 실제 환경에서 확인하기 위한 경로입니다. 페이지에서 데이터를 변경하는 조작은 실제 백엔드에 반영되므로 목업에서의 조작과 구분합니다.

후속 머지 때는 피처 브랜치에서 제거한 목업과 개발 코드가 다시 포함되지 않았는지 확인합니다. 개발 브랜치는 계속 목업을 사용할 수 있도록 유지합니다.

## 실행

Node.js 버전은 [.nvmrc](.nvmrc), Yarn 버전은 [package.json](package.json)의 `packageManager`를 따릅니다.

```sh
git switch dev/group-page
corepack enable
yarn install
yarn dev
```

[.env.development](.env.development)의 두 API 주소가 다음 값인지 확인합니다. 로컬 환경 파일이나 셸 환경변수로 덮어썼다면 목업 대신 다른 서버에 요청할 수 있습니다.

```dotenv
VITE_API_BASE_URL=/__mock-api
VITE_API_V2_BASE_URL=/__mock-api
```

Vite가 출력한 주소에서 **`/dev/group/1`**로 접속합니다. 기본 포트라면 다음 주소입니다.

```text
http://localhost:5173/dev/group/1
```

별도의 백엔드 실행이나 로그인은 필요하지 않습니다. 목업이 ID 1인 테스트 회원과 ID 1인 그룹을 반환합니다. 다른 그룹 ID는 목업에서 404를 반환합니다. 홈 화면 대신 위 주소로 직접 진입하세요.

## 그룹 페이지 체험

- 카드 클릭으로 창을 열고 내리기·올리기·펼치기·좌우 이동·교환을 조작합니다. 창 사이를 드래그하여 너비 비율을 바꾸고, 브라우저 뒤로가기·앞으로가기로 배치를 복원할 수 있습니다.
- 리스트와 카드를 만들거나 드래그하여 순서를 바꿉니다. 카드에서 라벨·담당자·커버 이미지·포트폴리오·활성 상태 등을 변경할 수 있습니다.
- 기록을 작성·수정하고 에디터의 사용법에서 입력 포맷을 확인합니다. 파일 첨부, 임시저장 복구, 기록 이동·삭제·보관도 체험할 수 있습니다. 샘플에는 팁탭과 레거시 HTML 기록이 함께 있습니다.
- 채팅방에서 메시지를 보내거나 외부 파일을 드롭합니다. 기록에 첨부된 파일을 채팅방으로 드래그할 수도 있습니다.
- 정보·멤버·저장소·활동공개·검색·활동로그·아카이브·설정 탭에서 샘플 데이터와 화면 흐름을 확인합니다. 저장소 응답과 파일 내용도 목업입니다.

AI 탭은 안내 화면이며 실제 대화 기능은 구현되어 있지 않습니다. 목업에서 동작하는 기능이 실제 백엔드와 연결되어 있다는 의미는 아닙니다. 외부 미디어와 `/legacy/image/...`, `/legacy/file/...` 리소스는 목업 서버가 모두 제공하지 않으므로 일부 샘플 첨부가 표시되지 않을 수 있습니다.

### 개발 탭

탭바 하단의 개발 아이콘은 호버하거나 활성화했을 때 보이며, 개발 빌드에서만 표시됩니다. 그룹 중단, 내가 그룹장 되기, 운영진 전환, 열린 활동보고 상태를 조작할 수 있습니다.

서버 시작 시 운영진으로 설정하려면 다음처럼 실행합니다.

```powershell
# PowerShell
$env:MOCK_MANAGER = 'true'
yarn dev
```

```sh
# macOS / Linux
MOCK_MANAGER=true yarn dev
```

개발 탭의 운영진 토글은 현재 사용자 응답을 바꿉니다. 일부 운영진용 목업 요청의 권한 판정은 시작 시의 `MOCK_MANAGER` 환경변수를 사용하므로, 그 경로를 체험하려면 위 설정으로 서버를 실행합니다.

### 데이터 유지와 초기화

그룹·채팅·업로드·서버 임시저장 데이터는 Vite 프로세스의 메모리에 있습니다. 브라우저 새로고침으로는 초기화되지 않으며 서버를 재시작하면 초기 데이터로 돌아갑니다. 목업 모듈을 수정해 다시 로드한 경우에도 상태가 초기화될 수 있습니다.

브라우저에 저장하는 값은 별도입니다.

| 항목 | 저장 위치 |
| --- | --- |
| 듀얼창 사용 여부·분할 비율 | localStorage의 `sight:group-page-preferences` |
| 테스트 회원의 기록 초안 | localStorage의 `sight:record-draft:1` |
| 창 배치 | URL 해시와 브라우저 히스토리 |

완전히 처음부터 체험하려면 서버를 재시작하고 필요한 저장 키만 삭제한 뒤, 해시 없는 `/dev/group/1` 주소로 들어갑니다.

## Vite 목업 구조

목업은 [vite.config.ts](vite.config.ts)에 등록된 `mockApi()` 플러그인의 개발 서버 미들웨어입니다. 별도 목업 프로세스 없이 `yarn dev`와 함께 실행됩니다. UI는 일반 API 함수를 호출하고, API 기본 주소가 `/__mock-api`라서 목업으로 전달됩니다.

| 파일 | 역할 |
| --- | --- |
| [dev/mockApi/index.ts](dev/mockApi/index.ts) | 요청 진입점, 현재 사용자·알림·이모지 응답, 파일 업로드·다운로드 및 샘플 파일 제공 |
| [dev/mockApi/groups.ts](dev/mockApi/groups.ts) | 그룹·칸반·기록·채팅·활동보고 요청 처리와 변경 상태 관리 |
| [dev/mockApi/groupFixtures.ts](dev/mockApi/groupFixtures.ts) | 그룹 초기 데이터와 카드·기록 등 샘플 생성 |
| [dev/mockApi/fixtures.ts](dev/mockApi/fixtures.ts) | 테스트 회원 등 공통 응답 |
| [dev/mockApi/repository.ts](dev/mockApi/repository.ts) | 저장소 API 목업 |
| [dev/mockApi/autosave.ts](dev/mockApi/autosave.ts) | 회원별 단일 임시저장 슬롯 목업 |
| [dev/mockApi/legacyRecordContent.ts](dev/mockApi/legacyRecordContent.ts) | 레거시 기록 HTML과 첨부 샘플 |
| `dev/mockApi/assets/` | 샘플 이미지 |

샘플을 바꿀 때는 해당 fixture를, 새 요청을 추가할 때는 해당 핸들러를 수정합니다. 미구현 요청은 JSON 404를 반환합니다. 업로드를 포함한 요청 본문은 목업 진입점에서 30 MiB로 제한합니다.

이 플러그인은 개발 서버에서만 동작합니다. `yarn build` 결과나 `yarn preview`에는 목업 서버가 없으므로 목업을 체험할 때는 `yarn dev`를 사용합니다.

## feat/group-page로 머지한 뒤 할 일

### 1. 목업 서버와 연결 설정 제거

- `dev/mockApi/` 전체를 삭제합니다. 핸들러·샘플 데이터·샘플 이미지가 모두 포함됩니다.
- `vite.config.ts`의 `mockApi` import와 플러그인 등록을 제거합니다.
- `.env.development`의 두 API 주소를 실제 개발 백엔드 주소로 변경합니다. 기존 `main`의 값은 `http://localhost:33333`이며, 연결할 환경에 맞게 결정합니다.
- 목업 제거만을 이유로 일반 API 함수·DTO·뷰어·업로드 UI를 삭제하지 않습니다. 목업 전용 npm 의존성은 별도로 없습니다.

### 2. 목업 상태 조작용 개발 탭 제거

- `src/features/member/GroupDetailContainer/tabs/GroupDevelopment/`를 삭제합니다.
- `src/api/public/group/GroupDevelopmentApi.ts`와 `src/api/public/UserDevelopmentApi.ts`를 삭제합니다.
- `groupDetailTabs.ts`의 `development` ID·라벨·아이콘·표시 옵션과 관련 분기를 제거합니다.
- `Dashboard/index.tsx`의 개발 탭 렌더링, 전용 mutation·query, 관련 import를 제거합니다. 일반 탭에서 필요한 요청이나 현재 사용자 조회는 유지합니다.

### 3. 개발 경로와 디버그 코드 정리

- `src/App.tsx`의 `/dev/group/:groupId`는 유지합니다. `main`에 머지한 뒤에도 이 경로로 새 그룹 페이지를 배포하고, 기존 그룹 화면의 진입 경로는 대체하지 않습니다.
- `/playground/tiptap` 경로와 `src/pages/playground/tiptap/`는 개발 도구로서 PR에 포함할지 검토합니다.
- `BlockEditor/styleDebug.ts`와 Toolbar·HeadingMenu의 스타일 로그 호출을 제거합니다. `runStyleCommand`를 제거할 때는 안에서 실행하던 에디터 명령을 직접 호출하여 서식 동작을 유지합니다.
- PWA의 `devOptions.enabled`는 목업과 별도 설정입니다. PR에서 개발용 서비스워커를 유지할지 결정합니다.

### 4. 실제 백엔드 계약 확인

`src/api/public/group/`의 일반 API 함수는 유지하고 실제 백엔드와 요청·응답 계약을 맞춥니다. 특히 `KanbanApi.ts`의 `TODO(mock)` 항목을 확인합니다.

- 기록 이동·개인 보관: 목업 기준으로 먼저 정한 경로와 DTO를 실제 계약에 맞춥니다.
- 기록 단건 조회: 현재 전체 카드와 기록 목록을 순회하는 구현을 실제 단건 조회 계약이 정해지면 교체합니다.
- 기록 본문 첨부 업로드: 업로드 URL 발급, 파일 전송과 최종 파일 주소 계약을 맞춥니다.
- `/legacy/image/...`, `/legacy/file/...`가 실제 서버에서 제공되는지 확인합니다.

이 항목들은 실제 화면에서 쓰는 기능이므로 목업 서버와 함께 함수를 삭제하지 않습니다. 실제 인증·권한·오류 응답과 파일 접근도 연결 환경에서 확인해야 합니다.

### 5. PR용 문서와 변경 범위 정리

이 README는 `dev/group-page` 전용 개발 안내이며 PR 브랜치에 포함하지 않습니다. 피처 브랜치로 머지할 때 이 README의 변경을 제외하고, PR 브랜치의 README는 대상 `main`의 내용을 유지합니다. 이 제외 작업은 후속 머지에서도 반복합니다.

개발 중 변경한 공통 컴포넌트·레이아웃·패키지 설정도 PR 범위에 필요한지 검토합니다. 개발용 목업 제거와 사용자 기능 제거를 구분하여 정리합니다.
