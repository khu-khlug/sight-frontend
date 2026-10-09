/*
 * sight-spring-backend/docs/plans/activity-report-*.md 기준 필드명을 그대로 따른다 —
 * 프론트 전용 목업 값을 임의로 짓지 않고 백엔드 계약과 맞춰둔다.
 * - 제출/파일 발급 링크 발급: 그룹장만 가능 (activity-report-submit.md, activity-report-upload-link.md)
 * - 조회: 그룹 멤버 누구나 가능 (activity-report-get.md)
 * - 접수 기간은 그룹이 아니라 운영진이 클럽 전체 단위(세미나 기수)로 연다 — 한 번에 하나만 열린다
 */

// activity-report-submit.md: false=보고서, true=세미나 발표
export const ACTIVITY_REPORT_TYPE_LABEL = { presentation: "세미나 발표", report: "보고서 제출" } as const;

// activity-report-get.md: seminarIsSpeakAfter — false=먼저말하기, true=나중에말하기
export const SPEAK_ORDER_LABEL = { before: "먼저 말하기", after: "나중에 말하기" } as const;

// activity-report-get.md: seminarIsSummerSeason — true=여름, false=겨울
export const SEASON_LABEL = { summer: "1학기(여름)", winter: "2학기(겨울)" } as const;

/*
 * 세미나 접수 기간(기수)은 그룹이 여는 게 아니라 운영진이 클럽 전체 단위로 연다
 * (tasks/group/GROUP_BUSINESS_RULES.md 11장) — 그룹은 열려 있는 동안 활동보고만 제출한다.
 * 한 번에 하나만 열릴 수 있어서 null(없음) | 하나만 있다.
 */
export type { OpenSeminarCohortDto as OpenSeminarCohort, ActivityReportDto as ActivityReport } from "../../../../../api/public/group/GroupExposureApi";
