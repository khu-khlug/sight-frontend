---
type: frontend
---

# 그룹 페이지 API 전환에 따른 화면 변경

## 작업 개요

그룹 상세 페이지를 새 그룹 API 명세에 맞춘다. API 함수 본문(경로·요청·응답 매핑)은 당연히 바꾸며, 이 문서는 그 밖에 화면·입력 검사·상태 처리·불러오기 방식에서 함께 바꿔야 하는 것을 모은다. 명세별 세부 계약은 각 API 문서를 따른다.

이미 별도 Task로 나눈 변경은 이 문서에서 다시 적지 않고 해당 Task를 따른다.

- 업로드 크기·형식 제한: [그룹 업로드 크기 제한 통일](group-upload-size-limit.md)
- 기록 첨부 업로드 흐름: [기록 첨부 파일 흐름 전환](group-record-attachment-flow.md)
- 기록 첨부 보기: [기록 첨부 파일 보기](group-record-attachment-list.md)
- 기록 임시저장: [기록 임시저장 API 전환](group-record-draft-api.md)
- 그룹 활동 로그 표시, 저장소 커밋·입력, 검색 페이지네이션, 그룹 상태 버튼, 사용 기술 입력: 워크스페이스 `tasks/open/group-*-frontend.md`

## 사용자와 목표

그룹원과 열람 회원은 서버가 거부할 동작을 화면에서 미리 알 수 있고, 목록은 스크롤하는 만큼 자연스럽게 이어서 불러온다. 서버 응답 코드가 바뀐 경우에도 알맞은 안내를 받는다.

## 사용자 경험 계약

### 그룹 상태에 따른 동작 제한

- 그룹 상태는 그룹 정보 조회의 `status`로 판단한다. 변경 동작 뒤에는 그룹 정보를 다시 불러와 중단 → 진행 중 자동 전환을 화면에 반영한다.
- 종료(`SUCCESS`·`FAIL`) 그룹에서는 아래 동작의 버튼·입력을 숨기거나 비활성화하고 이유를 툴팁으로 알린다.
  - 리스트·카드·기록의 생성·수정·삭제·복구·이동·순서 변경, 카드 담당자·레이블·커버·활성 상태·포트폴리오 포함 변경, 기록 포트폴리오 포함 변경, 개인 보관·보관 해제
  - 삭제된 카드 복구, 기록 임시저장 저장·삭제(종료 그룹에서는 편집 창의 임시저장을 쓰지 않는다)
  - 채팅 메시지 전송, 채팅방 생성·참여
  - 그룹 나가기, 멤버 내보내기, 그룹장 위임, 그룹 정보 변경, 포트폴리오 발행·취소
  - 활동보고 업로드·제출·수정·취소
- 즐겨찾기 추가·취소는 종료 그룹에서도 할 수 있다.
- 중단(`STOP`) 그룹에서는 아래 동작을 숨기거나 비활성화한다. 나머지 변경 동작은 실행하면 그룹이 진행 중으로 바뀐다.
  - 카드 레이블·포트폴리오 포함 변경, 기록 포트폴리오 포함 변경, 개인 보관·보관 해제
  - 즐겨찾기 추가·취소, 채팅 메시지 전송, 채팅방 생성·참여
  - 그룹 정보 변경, 포트폴리오 발행·취소
- 업로드 링크 발급·업로드 완료 알림, 기록 임시저장 저장·삭제는 중단 그룹에서도 실행한다. 그룹 상태는 바뀌지 않는다.

### 비활성 카드

- 비활성 카드에서는 이름·설명·커버·레이블·담당자·카드 포트폴리오 포함 변경과 기록 작성·수정·삭제·복구·이동·기록 포트폴리오 포함 변경을 숨긴다.
- 비활성 카드에서도 카드 삭제 버튼을 보인다. 재활성화 버튼과 함께 둔다.
- 비활성 카드도 칸반에서 끌어서 순서를 바꾸거나 다른 리스트로 옮길 수 있다.
- 비활성 카드의 기록도 개인 보관·보관 해제를 할 수 있다(그룹이 중단·종료 상태가 아닐 때).

### 카드 창

- 각 기록에 포트폴리오 포함·제외 버튼을 추가한다. 기록은 기본으로 포함(`isInPortfolio: true`)이며, 버튼으로 제외하거나 다시 포함한다. 그룹원 누구나 바꿀 수 있다. 카드 포트폴리오 버튼처럼 그룹 포트폴리오가 발행 중일 때만 보인다.
- 기록 정렬은 카드에 저장된 `recordSort`를 쓴다. 창을 열 때 카드 단건 조회의 값으로 시작하고, 정렬을 바꾸면 카드 정보 변경 API로 저장한다. 다른 그룹원에게도 같은 정렬이 보인다.
- 기록 수정 버튼은 작성자와 관계없이 보인다. 작성자가 아니면 서버가 수정을 거부하고 그 오류를 안내한다. `LEGACY` 기록은 지금처럼 수정 버튼을 숨긴다.
- 기록 보관 버튼의 보관됨 상태는 기록 응답의 `isInUserArchive`로 정한다. 보관 목록 전체를 따로 받지 않는다.
- 삭제된 기록 보이기는 그룹원에게만 보인다.
- 담당자 선택은 현재 그룹원만 고를 수 있고, 담당자 해제(없음)를 고를 수 있다.
- 레이블은 최대 8개까지 고를 수 있다. 9번째는 선택할 수 없다.
- 커버 외부 URL은 http·https 주소만 받는다.
- 기록 이동 메뉴에는 같은 그룹의 삭제되지 않은 활성 카드만 보인다.

### 입력 길이 제한

입력란에서 제한을 넘는 입력을 막거나, 저장 전에 남은 길이·초과를 보여 준다.

| 입력 | 제한 |
| :-- | :-- |
| 리스트 이름 | 앞뒤 공백 제거 후 1~255자 |
| 리스트 설명 | 1000자 |
| 카드 이름 | 앞뒤 공백 제거 후 1~255자 |
| 카드 설명 | UTF-8 4,096바이트 (한글·Markdown 문법·공백·줄바꿈 포함) |
| 기록 본문 | UTF-8 1 MiB(1,048,576바이트). 넘으면 저장하지 않고 알림 |
| 채팅 메시지 | 2000자. 2000자 이하여도 Discord가 거부해 400이면 길이 초과 안내 |
| 그룹 내 검색어 | 공백이 아닌 1~20자 |
| 그룹 이름 | 1~255자 |
| 사용 기술 | 쉼표 포함 255자 |
| 저장소 URL | http·https, 최대 5개, LF 포함 합계 255자 |

### 목록 이어 불러오기

- 칸반 리스트와 리스트 안의 카드는 끝까지 스크롤하면 다음 범위를 자동으로 불러온다. 채팅·활동 로그·삭제된 카드·보관한 기록은 더보기 버튼을 눌러 다음 범위를 불러온다. 불러오는 동안 목록 끝(채팅은 맨 위)에 스켈레톤을 보이고, 첫 불러오기에도 스켈레톤을 보인다.

| 목록 | 단위 | 다음 위치 | 방향 | 불러오는 방식 |
| :-- | :-- | :-- | :-- | :-- |
| 칸반 리스트 | 10개 | `skip + receivedCount` | 가로 | 자동 |
| 리스트 안의 카드 | 15개 (리스트 목록 응답에 처음 15개 포함) | `skip + receivedCount` | 세로, 리스트마다 | 자동 |
| 카드 창 기록 | 10개 | `skip + receivedCount` | 세로 | 자동 |
| 삭제된 카드 | 20개 | `skip + receivedCount` | 세로 | 더보기 |
| 보관한 기록 | 10개 | `skip + receivedCount` | 세로 | 더보기 |
| 그룹 활동 로그 | 50개 | `skip + receivedCount` | 세로 | 더보기 |
| 채팅 메시지 | 50개 | `skip + receivedCount`, `hasMore` | 위쪽(이전 메시지) | 더보기 |
| 저장소 커밋 | 30개 | `page + 1`, `hasMore` | 세로 | 더보기 |

- 다음 범위가 있는지는 `totalCount`와 지금까지 받은 개수, 또는 `hasMore`로 판단한다.
- 자동으로 불러오는 목록은 한 번 불러온 뒤에도 다음 범위가 있고 화면에 빈 공간이 남으면(목록이 스크롤되지 않으면) 빈 공간이 없어질 때까지 이어서 불러온다. 창 크기를 키워 빈 공간이 생겨도 같다.
- 자동 불러오기는 공통 훅 하나로 만든다. 스크롤 컨테이너와 끝 감지용 요소, `hasNextPage`·`isFetchingNextPage`·`fetchNextPage`를 받아, 끝 요소가 보이거나 컨테이너가 스크롤되지 않으면 다음 범위를 요청한다. 가로·세로·위쪽 방향을 모두 지원한다. TanStack Query의 `useInfiniteQuery`와 함께 쓴다.
- 칸반 리스트 안의 카드는 리스트마다 따로 이어 불러온다. 리스트 목록을 다시 불러와도 이미 펼친 카드 범위가 처음 15개로 줄어들지 않게 한다.

### 응답 코드에 따른 안내

| 상황 | 응답 | 화면 처리 |
| :-- | :-- | :-- |
| 삭제된 카드·기록에 요청 | 400 | 카드·기록이 삭제됐다고 알리고 해당 창을 닫고 목록을 다시 불러온다 |
| 없거나 다른 그룹의 카드·기록 | 404 | 찾을 수 없다고 알리고 창을 닫는다 |
| 이미 삭제된 카드 다시 복구 (`deleted-cards` 경로) | 404 | 삭제된 카드 목록을 다시 불러온다 |
| 임시저장이 서버보다 오래됨 | 409 | [기록 임시저장 API 전환](group-record-draft-api.md)을 따른다 |
| 저장소 `refresh=true` 1분 10회 초과, 사용자 시간당 한도 소진 | 429 | 잠시 뒤 다시 시도하라고 안내 |
| 공용 GitHub 한도 소진·저장소 서비스 실패 | 502 | 저장소 정보를 불러올 수 없다고 안내 |
| Discord 연동 정보 없음 (채팅방 생성·참여) | 422 | Discord 연동 페이지로 안내 |
| 즐겨찾기 중복 추가·미등록 취소 | 422 | 그룹 정보를 다시 불러와 즐겨찾기 상태를 맞춘다 |

### 칸반

- 카드 순서 변경은 `insertBeforeCardId`(앞에 둘 카드)로 보낸다. 맨 끝으로 옮기면 생략한다. 리스트 순서 변경도 `insertBeforeListId`로 같다.
- 카드가 남은 리스트(비활성 카드 포함)는 삭제 버튼을 비활성화하고, 카드를 먼저 옮기거나 삭제하라고 알린다.
- 카드 요약의 `isDisabled`·`isInPortfolio`·`assigneeUserId`를 표시에 쓴다.

### 아카이브 탭

- 삭제된 카드 복구 시 복구할 리스트를 고르게 한다. 카드는 고른 리스트 맨 끝에 들어간다.
- 보관한 기록 목록에서 원본이 삭제된 기록은 보이지 않는다. 보관 해제는 할 수 있다.

### 멤버 탭

- 멤버 목록은 서버가 정렬한 순서(그룹장 맨 앞, 나머지 실명순)를 그대로 쓰고 화면에서 다시 정렬하지 않는다.
- 소속 단과대학, 작성한 카드 수·기록 수를 보인다.
- 운영(`MANAGE`) 그룹에서는 멤버 내보내기 버튼을 숨긴다.
- 그룹장의 나가기 버튼은 운영 그룹이 아니면 위임을 먼저 하라고 안내한다. 운영 그룹의 그룹장은 바로 나갈 수 있다.

### 정보·설정·활동 공개 탭

- 그룹 정보의 `requesterInfo`(`userRole`, `isBookmarked`, `isInChatRoom`), `hasChatRoom`, `exposure.isPortfolioPublished`로 버튼 상태를 정한다.
- 채팅방 생성 버튼은 그룹장에게만 보인다. 이미 참여했으면 참여 버튼을 숨긴다.
- 참가 버튼은 `allowJoin`이 꺼졌거나 종료 그룹이면 숨긴다.
- 그룹 정보 변경에서 운영진이 아니면 유형을 `STUDY`·`PROJECT`·`DOCUMENTATION`만 고를 수 있다. `MANAGER_ONLY` 공개 범위는 운영진이면서 유형이 `MANAGE`일 때만 고를 수 있다.
- 포트폴리오 발행 응답은 `isPublished`로 읽는다.
- 활동보고 수정은 그룹장만, 취소는 그룹장 또는 운영진만 할 수 있다. 접수 마감(`schedule.endAt`) 정각부터 수정·취소 버튼을 숨긴다.
- GitHub 개인 사용량을 끈 뒤 7일이 지나기 전에는 다시 켤 수 없다고 안내한다.

### 저장소 탭

- 브랜치는 최대 100개까지 보인다.
- 파일 트리는 브랜치를 고르면 `branch`로, 특정 커밋을 고르면 `commitSha`로 요청한다.
- 새로고침 버튼은 `refresh=true`로 요청하며, 429면 잠시 뒤 다시 시도하라고 안내한다.
- `truncated: true`면 트리 일부만 표시했다고 알린다.

## 허용 및 제한 정책

명세의 그룹 상태·비활성 카드·권한·입력 제한을 화면에서 미리 반영한다. 최종 판단은 서버가 한다.

## 입력 및 복구

- 서버가 400·404로 거부하면 입력 중인 내용(카드 설명, 채팅 본문 등)을 지우지 않는다.
- 목록 이어 불러오기가 실패하면 목록 끝에 다시 시도 버튼을 보이고, 이미 불러온 항목은 유지한다.

## 데이터 및 연동

- 아이디 타입: 그룹·회원·기록·그룹 활동 로그 아이디는 숫자, 리스트·카드·파일·활동보고 아이디는 문자열이다. 타입 정의와 URL 해시(`windowHash`), 쿼리 키, 개발용 Mock의 기록 아이디(`"1-3-long-r1"` 등)를 이에 맞춘다.
- 시각은 UTC ISO 8601 `Z` 문자열로 받는다. 표시할 때 로컬 시각으로 바꾼다.
- 필드 이름 변경: `portfolio` → `isInPortfolio`, `disabled` → `isDisabled`, 기록 `deleted` → `isDeleted`, 정렬 `newest` 등 → `NEWEST`·`OLDEST`·`RECENTLY_UPDATED`, 목록 `offset` → `skip`.
- 개발용 Mock(`dev/mockApi/`)도 새 경로·필드·페이지 단위·응답 코드로 맞춘다.

## 사용자 보호 및 개인정보

변경 없음

## 접근성 및 사용 환경

- 숨기지 않고 비활성화한 버튼에는 이유를 툴팁과 `aria-disabled`로 알린다.
- 스켈레톤은 `aria-busy`로 불러오는 중임을 알린다.

## 검증

사용자가 직접 브라우저에서 확인한다. 요청에 따라 에이전트는 테스트와 브라우저 동작 확인을 수행하지 않는다.

## 비목표

백엔드 구현, 카드 이어받기, 특수 그룹(고객센터·활용실습 등) 예외 처리.

## 연동 계약

- [그룹 API 공통 사항](../../../sight-spring-backend/docs/plans/group/global.md): 중단 상태 동작 제한, 같은 값의 재요청, 소프트 삭제된 카드·기록, 아이디 타입
- [카드 활성 상태 변경](../../../sight-spring-backend/docs/plans/group/card-window/group-card-disabled-update.md#비활성-상태의-동작)
- 각 그룹 API 문서: `sight-spring-backend/docs/plans/group/`

변경할 위치:

| 파일 | 현재 | 변경 |
| :-- | :-- | :-- |
| `src/features/member/GroupDetailContainer/index.tsx` | 칸반 리스트를 `useQuery` 한 번으로 전부 불러옴 | 리스트·리스트별 카드를 `useInfiniteQuery`와 공통 이어 불러오기 훅으로 불러오고 스켈레톤 표시 |
| `src/features/member/GroupDetailContainer/KanbanBoard/`, `CardList/` | 이어 불러오기·스켈레톤 없음 | 가로(리스트)·세로(카드) 끝 감지, 빈 공간 채우기, 카드 남은 리스트 삭제 비활성화, 비활성 카드 드래그 허용 |
| `src/features/member/GroupDetailContainer/CardWindow/index.tsx` | 정렬이 창 안의 로컬 상태(기본 `newest`). 비활성 카드면 활성화 버튼만 보임 | 카드의 `recordSort`로 시작하고 변경 시 카드 정보 변경 API로 저장. 비활성 카드에도 삭제 버튼. 기록 목록을 공통 이어 불러오기 훅으로 교체 |
| `src/features/member/GroupDetailContainer/CardWindow/RecordItem/index.tsx` | 기록 포트폴리오 버튼 없음. 수정 버튼이 작성자 여부와 무관하게 보임. 비활성 카드에서 보관 버튼 숨김. 삭제된 기록의 복구 버튼은 카드 상태와 무관하게 보임 | 기록 포트폴리오 포함·제외 버튼 추가. 수정 버튼은 작성자만. 비활성 카드에서도 보관·보관 해제 허용. 비활성 카드에서는 복구 버튼 숨김 |
| `src/features/member/GroupDetailContainer/CardWindow/RecordSortMenu/` | 로컬 정렬 값 | `NEWEST`·`OLDEST`·`RECENTLY_UPDATED` 값으로 카드 설정 저장 |
| `src/features/member/GroupDetailContainer/CardWindow/AssigneePicker/` | 그룹원 선택 | 현재 그룹원만, 담당자 해제 선택 추가. 비활성 카드에서는 열지 않음 |
| `src/features/member/GroupDetailContainer/CardWindow/RecordItem/RecordMoveMenu.tsx` | 이동 대상 카드 목록 | 같은 그룹의 삭제되지 않은 활성 카드만 |
| `src/features/member/GroupDetailContainer/CardWindow/CoverImageForm/` | 외부 URL 검사 확인 필요 | http·https URL만 허용 |
| `src/features/member/GroupDetailContainer/EditWindow/` | 본문 크기 검사 없음 | UTF-8 1 MiB 초과 시 저장하지 않고 알림. 종료 그룹이면 임시저장 비사용 |
| `src/features/member/GroupDetailContainer/tabs/GroupArchive/` | 삭제된 카드·보관 기록 목록 | 20개·10개 단위 이어 불러오기, 복구할 리스트 선택 |
| `src/features/member/GroupDetailContainer/tabs/GroupActivityLog/` | 로그 목록 | 50개 단위 이어 불러오기 |
| `src/features/member/GroupDetailContainer/tabs/GroupChat/index.tsx` | 메시지 목록·전송 | 50개 단위 위쪽 이어 불러오기, 2000자 제한, 중단·종료 그룹 전송 비활성화, 400(길이 초과) 안내 |
| `src/features/member/GroupDetailContainer/tabs/GroupMemberList/` | 멤버 목록 | 서버 정렬 그대로, 단과대학·카드 수·기록 수 표시, 운영 그룹 내보내기 숨김 |
| `src/features/member/GroupDetailContainer/tabs/GroupSearch/` | 검색 입력 | 1~20자 제한 |
| `src/features/member/GroupDetailContainer/tabs/GroupSettings/` | 그룹 정보 편집 | 그룹 상태별 비활성화, 유형·공개 범위 선택 제한, 길이 제한 |
| `src/features/member/GroupDetailContainer/tabs/GroupExposure/` | 활동보고·포트폴리오 | 권한·접수 마감·그룹 상태별 버튼 처리, `isPublished` |
| `src/features/member/GroupDetailContainer/tabs/GroupRepository/` | 저장소 조회 | 브랜치 최대 100개, `branch`/`commitSha` 트리 조회, 429·502 안내, `truncated` 안내, 커밋 이어 불러오기 |
| `src/features/member/GroupDetailContainer/Dashboard/`, `tabs/GroupInfo/` | 그룹 정보 표시 | `requesterInfo`·`hasChatRoom`·`isPortfolioPublished`로 버튼 상태, 즐겨찾기 중단 그룹 비활성화 |
| `src/features/member/GroupDetailContainer/WindowLayer/windowHash.ts` | 창 해시에 아이디 문자열 사용 | 기록 아이디를 숫자로 다룸 |
| 공통 이어 불러오기 훅 (새 파일) | 없음 | 끝 감지·빈 공간 채우기·방향 지원 훅 |
| `dev/mockApi/groups.ts`, `dev/mockApi/groupFixtures.ts` | 기존 경로·필드 | 새 경로·필드·페이지 단위·응답 코드, 숫자 기록 아이디 |

## 진행 상태

구현했고 사용자 확인 전이다.
