---
type: frontend
---

# 기록 임시저장 API 전환

## 작업 개요

기록 임시저장 API 클라이언트를 전역 `/autosave` 경로에서 그룹 경로의 `draft` API로 바꾸고, `location`·`extra` 대신 명시적인 필드를 쓴다.

## 사용자와 목표

기록을 작성·수정하는 회원은 지금처럼 임시저장을 이어 쓸 수 있으며, 다른 그룹의 임시저장이 이 그룹에서 잘못 보이지 않는다.

## 사용자 경험 계약

- 임시저장은 회원당 하나다. 다른 그룹에서 임시저장하면 기존 임시저장을 대체한다.
- 보관함 탭의 "임시저장: 카드명" 버튼과 편집창의 복원 확인은 이 그룹의 임시저장일 때만 나타난다. 그룹 판단은 서버가 한다.
- 복원 확인은 지금처럼 메타데이터를 먼저 조회하고, 사용자가 불러오기를 선택한 뒤에 본문을 조회한다.

## 허용 및 제한 정책

정책 변경 없음

## 입력 및 복구

- 임시저장 저장이 409로 실패하면 더 최신 임시저장이 있음을 알린다.
- 본문 조회가 404이면 임시저장이 없거나 다른 그룹 것으로 보고 복원하지 않는다.

## 데이터 및 연동

- `src/api/public/group/AutosaveApi.ts`를 그룹 경로의 draft API로 바꾼다. 이름도 draft에 맞춘다.
  - 메타데이터: `GET /groups/{groupId}/records/draft/meta` → `draft`(null 가능)
  - 본문: `GET /groups/{groupId}/records/draft`
  - 저장: `PUT /groups/{groupId}/records/draft` (`cardId`, `recordId`, `content`, `files`, `updatedAt`)
  - 삭제: `DELETE /groups/{groupId}/records/draft`
- `location`은 `cardId`·`recordId`로, `extra`의 그룹·카드 정보는 서버 응답 필드로 대체한다. `extra`를 파싱하는 코드(`tabs/GroupArchive`, `EditWindow/useRecordDraft.ts`)를 정리한다.
- `updatedAt`은 Unix 밀리초 숫자가 아니라 ISO 8601 UTC 문자열로 주고받는다.
- 로컬 임시저장도 서버 저장 요청과 같은 형식(`cardId`·`recordId`·`content`·`files`·`updatedAt`)으로 저장하고, 서버가 경로로 정하는 그룹 아이디만 더한다. 이 형식이 아닌 기존 로컬 임시저장은 없는 것으로 본다.
- 로컬 임시저장과 서버 임시저장 중 무엇을 복원할지(`useRecordDraft.ts`)는 아래 순서로 정한다.
  1. 서버 메타데이터 조회로 이 그룹의 임시저장이 있는지 본다.
  2. 서버에 이 그룹의 임시저장이 없으면 로컬 임시저장도 무시하고 복원하지 않는다.
  3. 서버에 이 그룹의 임시저장이 있으면 로컬 임시저장이 이 그룹의 것인지 확인한다. 이 그룹의 것이면 서버와 로컬 중 수정 시각이 더 최신인 것을 쓰고, 아니면 서버 임시저장을 쓴다.
- 첨부 파일 배열과 업로드 처리는 [기록 첨부 파일 흐름](group-record-attachment-flow.md)을 따른다. 복원한 본문은 영구 주소로 표시하고, 새 파일의 아이디·주소를 받은 뒤에는 후속 임시저장을 수행한다.
- 개발용 Mock(`dev/mockApi/autosave.ts`)을 같은 계약으로 바꾼다.

## 사용자 보호 및 개인정보

변경 없음

## 접근성 및 사용 환경

변경 없음

## 검증

사용자가 직접 브라우저에서 임시저장·복원·삭제, 다른 그룹 임시저장이 있을 때의 표시, 409 처리를 확인한다. 요청에 따라 에이전트는 테스트와 브라우저 동작 확인을 수행하지 않는다.

## 비목표

백엔드 구현.

## 연동 계약

- [기록 임시저장 정보 조회](../../../sight-spring-backend/docs/plans/group/edit-window/group-record-draft-metadata-get.md)
- [기록 임시저장 본문 조회](../../../sight-spring-backend/docs/plans/group/edit-window/group-record-draft-get.md)
- [기록 임시저장 저장](../../../sight-spring-backend/docs/plans/group/edit-window/group-record-draft-save.md)
- [기록 임시저장 삭제](../../../sight-spring-backend/docs/plans/group/edit-window/group-record-draft-delete.md)

## 진행 상태

구현했고 사용자 확인 전이다.
