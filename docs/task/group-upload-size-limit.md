---
type: frontend
---

# 그룹 업로드 크기 제한 통일

## 작업 개요

그룹 상세 페이지의 파일 업로드 크기 제한을 백엔드 명세에 맞춰 통일한다. 채팅 첨부, 카드 커버 이미지, 기록 첨부, 활동보고 파일의 클라이언트 크기 검사와 채팅 전송 실패 시 안내를 변경하고, 채팅 첨부 전송 방식을 base64 JSON에서 `multipart/form-data`로 바꾼다.

## 사용자와 목표

그룹 페이지에서 파일을 올리는 회원은 업로드 종류와 관계없이 같은 크기 기준으로 안내를 받고, 서버나 디스코드가 거부할 크기의 파일은 전송 전에 또는 전송 직후에 이유를 알 수 있다.

## 사용자 경험 계약

- 모든 크기는 1024 단위로 계산한다. 1 MiB는 1,048,576바이트다.
- 카드 커버 이미지, 기록 첨부(이미지·오디오·동영상·파일), 활동보고 파일은 파일 하나당 최대 20 MiB(20,971,520바이트)까지 허용한다. 정확히 20 MiB는 허용한다.
- 채팅 첨부는 파일 하나당 최대 20 MiB, 한 메시지의 첨부 크기 합계 최대 25 MiB(26,214,400바이트)까지 허용한다. 첨부 개수는 제한하지 않는다.
- 제한을 넘는 파일을 고르거나 끌어 놓으면 전송 전에 용량이 커서 첨부할 수 없다는 알림을 띄우고 해당 파일을 첨부하지 않는다. 합계 초과도 같은 방식으로 안내한다.
- 채팅 전송 요청이 413으로 실패하면 파일 용량이 커서 보낼 수 없다는 알림을 띄운다. 그 밖의 전송 실패는 기존 실패 안내를 유지한다.
- 알림 문구의 최대 크기 표시는 "20MB", "25MB"처럼 MiB 값을 정수로 보여준다.

## 허용 및 제한 정책

정책 변경 없음

## 입력 및 복구

채팅 전송이 413으로 실패하면 작성 중인 본문과 첨부 목록을 유지해 사용자가 첨부를 줄여 다시 보낼 수 있게 한다.

## 데이터 및 연동

크기 기준은 백엔드 명세를 따른다. 클라이언트 검사는 사용자 안내를 위한 사전 검사이며 최종 판단은 서버와 디스코드가 한다. 개발용 Mock의 요청 크기 제한(30MB)은 이번 기준보다 크므로 변경하지 않는다.

## 사용자 보호 및 개인정보

변경 없음

## 접근성 및 사용 환경

변경 없음

## 검증

사용자가 직접 브라우저에서 각 업로드의 20 MiB 경계, 채팅 첨부 합계 25 MiB 경계, 채팅 413 응답 시 알림과 입력 유지를 확인한다. 요청에 따라 에이전트는 테스트와 브라우저 동작 확인을 수행하지 않는다.

## 비목표

백엔드 구현, 디스코드 서버 부스트 단계에 따른 한도 조회, 기록별 첨부 개수 제한과 허용 형식 확정.

## 연동 계약

- 업로드 크기 기준: [그룹 API 공통 사항의 업로드 링크 기준](../../../sight-spring-backend/docs/plans/group/global.md#업로드-링크-기준)
- 채팅 크기 기준과 413 응답: [그룹 채팅 메시지 전송](../../../sight-spring-backend/docs/plans/group/chat/group-chat-message-send.md)

변경할 위치:

| 파일 | 현재 | 변경 |
| :-- | :-- | :-- |
| `src/features/member/GroupDetailContainer/CardWindow/CoverImageForm/index.tsx` | 커버 10MB | 20 MiB |
| `src/features/member/GroupDetailContainer/tabs/GroupChat/index.tsx` | 파일당 10MB, 합계 검사 없음. 첨부를 `readAsDataURL`로 base64 변환해 JSON으로 전송 | 파일당 20 MiB, 합계 25 MiB, 413 응답 시 용량 알림. base64 변환 없이 `multipart/form-data`(`content` 텍스트 파트, 파일마다 `files` 파트)로 전송 |
| 채팅 API 클라이언트와 개발용 Mock의 채팅 전송 처리 | base64 JSON 요청 | `multipart/form-data` 요청을 보내고 받도록 변경 |
| `src/components/BlockEditor/mediaInput/mediaKinds.ts` | 이미지 10MB, 그 외 20MB. 임시 값 TODO 주석 | 모두 20 MiB. 임시 값 주석을 백엔드 기준을 따른다는 설명으로 정리. 기록 첨부의 업로드 시점은 [기록 첨부 파일 흐름](group-record-attachment-flow.md)을 따르며, 크기 검사는 파일을 넣는 시점에 한다. 이미지·오디오·동영상 블록에 넣은 파일이 백엔드 [허용 형식](../../../sight-spring-backend/docs/plans/group/global.md#허용-형식)이 아니면 그 블록에 넣지 않고 허용 형식을 알리는 알림을 띄운다(이미지의 `svg`·`bmp`·`ico`·`apng`, 동영상의 `mov`·`m4v`·`ogv` 등). 형식 확인에 쓰는 확장자 목록도 같은 기준으로 맞춘다 |
| `src/features/member/GroupDetailContainer/CardWindow/CoverImageForm/index.tsx` (형식) | 이미지 여부만 확인 | 고르거나 붙여넣은 파일이 커버 허용 형식(`jpeg`, `png`, `webp`, `gif`, `avif`)이 아니면 업로드하지 않고 허용 형식을 알리는 알림을 띄움 |
| `src/features/member/GroupDetailContainer/tabs/GroupExposure/index.tsx` | 활동보고 20MB | 유지 |

## 진행 상태

구현했고 사용자 확인 전이다.
