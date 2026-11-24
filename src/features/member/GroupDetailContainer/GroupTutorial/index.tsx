import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { GroupDetailTabId } from "../groupDetailTabs";
import styles from "./style.module.css";

type Step = { tab: GroupDetailTabId | null; title: string; action: string; description: string };
const steps: Step[] = [
  { tab: "info", title: "그룹 정보 확인하기", action: "강조된 정보 탭을 눌러 주세요.", description: "그룹 소개와 참여 설정을 살펴보세요. 기존 그룹페이지로 이동하는 버튼도 이 탭 아래에 있습니다." },
  { tab: "member", title: "함께하는 멤버 확인하기", action: "멤버 탭을 눌러 주세요.", description: "멤버 목록에서 함께 활동할 사람들을 확인하세요. 사용할 수 있는 관리 기능은 권한에 따라 달라집니다." },
  { tab: "schedule", title: "그룹 일정 살펴보기", action: "스케줄 탭을 눌러 주세요.", description: "달력과 일정 목록을 살펴보세요. 모바일에서는 탭 내용 안에서 스크롤할 수 있습니다." },
  { tab: "search", title: "필요한 활동 찾기", action: "검색 탭을 눌러 주세요.", description: "검색어와 검색 대상을 선택해 카드와 기록을 찾아보세요. 검색 결과를 누르면 해당 내용을 열 수 있습니다." },
  { tab: null, title: "보드로 돌아가기", action: "보드로 돌아가 주세요.", description: "보드를 좌우로 스크롤하며 리스트와 카드를 살펴보세요. 카드를 누르면 상세 창이 열립니다. 편집 권한이 있다면 ‘새 기록 작성’으로 활동을 남길 수 있습니다." },
  { tab: "settings", title: "설정에서 다시 시작하기", action: "설정 탭을 눌러 주세요.", description: "개인설정에서 듀얼창 사용 여부 등을 바꿀 수 있습니다. ‘사용법 튜토리얼’을 누르면 이 안내를 언제든 다시 시작할 수 있습니다." },
];

type Props = { activeId: GroupDetailTabId | null; isMobile: boolean; onClose: () => void };
type TargetRect = { x: number; y: number; width: number; height: number };

export default function GroupTutorial({ activeId, isMobile, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const step = steps[stepIndex];
  const reached = activeId === step.tab;
  const target = reached
    ? step.tab === null ? "board" : "tab-content"
    : step.tab === null ? `tab-${isMobile ? "board" : activeId}` : `tab-${step.tab}`;

  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 탭의 가로 스크롤, 패널 전환과 화면 회전 중에도 강조 위치를 맞춘다.
  useEffect(() => {
    let frame = 0;
    let previous: TargetRect | null = null;
    let scrolledElement: Element | null = null;
    setRect(null);
    const update = () => {
      const element = document.querySelector<HTMLElement>(`[data-group-tour="${target}"]`);
      if (element && element !== scrolledElement && !reached) {
        element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        scrolledElement = element;
      }
      const bounds = element?.getBoundingClientRect();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const x = Math.max(4, bounds.left - 4);
        const y = Math.max(4, bounds.top - 4);
        const next = { x, y, width: Math.max(0, Math.min(window.innerWidth - 4, bounds.right + 4) - x), height: Math.max(0, Math.min(window.innerHeight - 4, bounds.bottom + 4) - y) };
        if (!previous || next.x !== previous.x || next.y !== previous.y || next.width !== previous.width || next.height !== previous.height) {
          previous = next;
          setRect(next);
        }
      } else if (previous) { previous = null; setRect(null); }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [target, reached]);

  const boardAction = isMobile ? "왼쪽의 보드 탭을 눌러 주세요." : "현재 선택된 탭을 한 번 더 눌러 닫아 주세요.";
  return createPortal(
    <div className={styles.tour}>
      {rect && <div className={styles.highlight} style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }} aria-hidden="true" />}
      <aside className={styles.panel} role="region" aria-label="그룹페이지 동작형 튜토리얼">
        <header className={styles.header}>
          <span>사용법 튜토리얼 · {stepIndex + 1} / {steps.length}</span>
          <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="튜토리얼 종료"><X size={20} /></button>
        </header>
        <div className={styles.progress} aria-hidden="true">{steps.map((item, index) => <span key={item.title} data-current={index === stepIndex} data-complete={index < stepIndex} />)}</div>
        <div className={styles.body} aria-live="polite" aria-atomic="true">
          <h2>{step.title}</h2>
          <p>{reached ? step.description : step.tab === null ? boardAction : step.action}</p>
          <div className={styles.status}>{reached ? <><Check size={16} /> 해당 화면을 열었습니다</> : "강조된 탭을 직접 누르면 다음 단계로 진행할 수 있어요."}</div>
        </div>
        <footer className={styles.footer}>
          <button type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((index) => index - 1)}><ArrowLeft size={16} /> 이전</button>
          <button type="button" className={styles.next} disabled={!reached} onClick={() => stepIndex === steps.length - 1 ? onClose() : setStepIndex((index) => index + 1)}>{stepIndex === steps.length - 1 ? "완료" : "다음"}<ArrowRight size={16} /></button>
        </footer>
      </aside>
    </div>, document.body,
  );
}
