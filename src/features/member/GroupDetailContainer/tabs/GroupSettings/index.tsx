import { GroupSettingsApi } from "../../../../../api/public/group/GroupSettingsApi";
import { UserPublicApi } from "../../../../../api/public/user";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { useUnsavedChangesBeforeUnload } from "../../../../../hooks/browser/useUnsavedChangesBeforeUnload";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { BookOpen, Circle, CircleHelp, LogOut, RefreshCw, Settings2, ShieldAlert, SquarePen, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import AppTooltip from "../../../../../components/AppTooltip";
import { GroupCategory, GroupStatus } from "../../../../../constant";
import { extractErrorMessage } from "../../../../../util/extractErrorMessage";
import { GroupInfo } from "../GroupInfo/types";
import { groupPagePreferences } from "../../groupPagePreferences";
import { useGroupPagePreferences } from "../../useGroupPagePreferences";
import GroupInfoEditor, { type EditableGroupInfo } from "./GroupInfoEditor";
import styles from "./style.module.css";

type Props = {
  info: GroupInfo;
  isManager: boolean;
  isLeader: boolean;
  isEditing: boolean;
  titleDraft: string;
  onStartEdit: () => void;
  onCloseEdit: () => void;
  onSave: (changes: EditableGroupInfo) => void;
  // 실제 싱글/듀얼 강제는 WindowLayer가 하는 전역 설정이라, 이 컴포넌트는 값과 변경 요청만
  // 받는다(공통 조상인 GroupDetailContainer가 들고 있다).
  dualWindowEnabled: boolean;
  onDualWindowEnabledChange: (value: boolean | null) => void;
  // Dashboard가 들고 있는 "탭 전환 confirm 포인터"에 자신의 확인 함수를 등록/해제한다 —
  // 개인설정에 저장 안 한 변경이 있는 동안 등록해두면, 탭 아이콘을 눌렀을 때 Dashboard의
  // 공용 탭 전환 핸들러가 이 함수부터 실행해서 확인을 받는다. 저장 안 한 변경이 없거나
  // 저장 버튼을 누르면 null로 바꿔 해제한다.
  onUnsavedPersonalSettingsGuardChange: (confirmLeave: (() => boolean) | null) => void;
  // GroupInfoEditor(그룹 정보 변경 패널)가 같은 메커니즘으로 쓸 수 있게 그대로 통과시켜준다 —
  // 이 컴포넌트 자신은 그 안의 draft를 몰라도 된다.
  onUnsavedGroupInfoGuardChange: (confirmLeave: (() => boolean) | null) => void;
};

type ToggleSide = { icon: LucideIcon; tooltip: string; onSelect: () => void };

// 개인설정 펼침 안의 "라벨 + 좌우 슬라이드 토글" 한 줄 — GroupInfoEditor의 "참여 신청"과 같은
// .toggle 마크업을 재사용한다. 옵션 글자 수가 제각각이라 토글 너비가 들쭉날쭉해지는 문제가
// 있었어서, 버튼 안에는 아이콘 하나만 두고 설명은 툴팁으로 옮겼다 — 아이콘은 크기가 고정이라
// 좌우 폭이 항상 같다. isRightSelected/onSelect는 호출부가 쥐고 있는 draft 상태를 그대로
// 받아 보여주기만 한다 — 실제 저장은 "저장" 버튼이 한다.
function SettingToggleRow({ label, description, isRightSelected, left, right }: { label: string; description: string; isRightSelected: boolean; left: ToggleSide; right: ToggleSide }) {
  const [showDescription, setShowDescription] = useState(false);
  return (
    <AppTooltip content={description} placement="right" open={showDescription}>
      <div className={styles.settingRow}>
        <span
          className={styles.settingLabel}
          tabIndex={0}
          onPointerEnter={() => setShowDescription(true)}
          onPointerLeave={() => setShowDescription(false)}
          onFocus={() => setShowDescription(true)}
          onBlur={() => setShowDescription(false)}
        >
          {label} <CircleHelp className={styles.settingHelpIcon} size={14} aria-hidden="true" />
        </span>
        <div className={`${styles.toggle} ${styles.settingToggle}`} role="group" aria-label={label} data-right-selected={isRightSelected}>
          <AppTooltip content={left.tooltip} placement="top">
            <button type="button" className={!isRightSelected ? styles.selected : undefined} aria-pressed={!isRightSelected} onClick={left.onSelect}>
              <left.icon size={16} />
            </button>
          </AppTooltip>
          <AppTooltip content={right.tooltip} placement="top">
            <button type="button" className={isRightSelected ? styles.selected : undefined} aria-pressed={isRightSelected} onClick={right.onSelect}>
              <right.icon size={16} />
            </button>
          </AppTooltip>
        </div>
      </div>
    </AppTooltip>
  );
}

// 사용/사용 안 함 같은 이항 설정 공통 아이콘 — O(사용)가 오른쪽에 오도록 통일한다.
function booleanToggleSides(onChange: (value: boolean) => void, onTooltip = "사용", offTooltip = "사용 안 함"): { left: ToggleSide; right: ToggleSide } {
  return {
    left: { icon: X, tooltip: offTooltip, onSelect: () => onChange(false) },
    right: { icon: Circle, tooltip: onTooltip, onSelect: () => onChange(true) },
  };
}

// 토글은 즉시 미리보기로 적용한다. 확정 시 듀얼 설정은 로컬, GitHub 설정은 서버에 저장한다.
type PersonalSettingsDraft = {
  dualWindowEnabled: boolean;
  usePersonalGithub: boolean;
};

export default function GroupSettings({ info, isManager, isLeader, isEditing, titleDraft, onStartEdit, onCloseEdit, onSave, dualWindowEnabled, onDualWindowEnabledChange, onUnsavedPersonalSettingsGuardChange, onUnsavedGroupInfoGuardChange }: Props) {
  const preferences = useGroupPagePreferences();
  const action = useGroupAction(info.id);
  const [showStatus, setShowStatus] = useState(false);
  const [showPersonalSettings, setShowPersonalSettings] = useState(false);
  const [showManagerSettings, setShowManagerSettings] = useState(false);
  // 패널이 닫히면 미리보기 값을 마지막 저장값으로 되돌린다.
  const [draft, setDraft] = useState<PersonalSettingsDraft>(() => ({
    dualWindowEnabled,
    usePersonalGithub: false,
  }));
  // 마지막으로 저장에 성공한 값 — 저장이 실패하거나 저장 없이 패널/탭을 나가면 이 값으로
  // 되돌린다.
  const savedSettingsRef = useRef(draft);
  const draftRef = useRef(draft);
  const previewActiveRef = useRef(false);
  const personalSettingsGuardChangeRef = useRef(onUnsavedPersonalSettingsGuardChange);
  personalSettingsGuardChangeRef.current = onUnsavedPersonalSettingsGuardChange;
  const applyPersonalSettings = useCallback((settings: PersonalSettingsDraft) => {
    onDualWindowEnabledChange(settings.dualWindowEnabled);
  }, [onDualWindowEnabledChange]);

  useEffect(() => () => {
    // 탭 변경 이외의 경로로 언마운트되어도 임시 설정을 남기지 않는다.
    onDualWindowEnabledChange(null);
    personalSettingsGuardChangeRef.current(null);
  }, [onDualWindowEnabledChange]);

  useEffect(() => {
    if (showPersonalSettings || previewActiveRef.current) return;
    const saved = { ...savedSettingsRef.current, dualWindowEnabled: preferences.dualWindowEnabled };
    savedSettingsRef.current = saved;
    draftRef.current = saved;
    setDraft(saved);
  }, [preferences.dualWindowEnabled, showPersonalSettings]);

  const discardPersonalSettings = (force = false) => {
    // 이미 저장을 누른 값은 응답 대기 중 패널을 다시 닫아도 유지한다.
    if (!force && !previewActiveRef.current && preferenceMutation.isPending) return;
    const saved = { ...savedSettingsRef.current, dualWindowEnabled: groupPagePreferences.getSnapshot().dualWindowEnabled };
    savedSettingsRef.current = saved;
    draftRef.current = saved;
    setDraft(saved);
    previewActiveRef.current = false;
    onDualWindowEnabledChange(null);
    onUnsavedPersonalSettingsGuardChange(null);
  };

  // 상태 갱신 함수 안에서 부모 상태를 변경하지 않고, 같은 이벤트에서 미리보기를 반영한다.
  const updateDraft = (updater: (current: PersonalSettingsDraft) => PersonalSettingsDraft) => {
    if (preferenceMutation.isPending) return;
    const next = updater(draftRef.current);
    draftRef.current = next;
    setDraft(next);
    applyPersonalSettings(next);
    previewActiveRef.current = true;
    onUnsavedPersonalSettingsGuardChange(() => {
      discardPersonalSettings();
      setShowPersonalSettings(false);
      return true;
    });
  };

  const handleCancelPersonalSettings = () => {
    discardPersonalSettings();
    setShowPersonalSettings(false);
  };

  const preferenceMutation = useMutation({
    mutationFn: (usePersonalGithub: boolean) => UserPublicApi.updatePreference({
      usePersonalGithubUsage: usePersonalGithub,
    }),
    onSuccess: (_data, usePersonalGithub) => {
      const saved = { dualWindowEnabled: groupPagePreferences.getSnapshot().dualWindowEnabled, usePersonalGithub };
      savedSettingsRef.current = saved;
      draftRef.current = saved;
      setDraft(saved);
    },
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error));
      discardPersonalSettings(true);
    },
  });
  useUnsavedChangesBeforeUnload(preferenceMutation.isPending);
  const handleSavePersonalSettings = () => {
    // 로컬 저장은 서버 요청과 독립적이다. GitHub 저장 실패로 듀얼 설정을 되돌리지 않는다.
    if (preferenceMutation.isPending) return;
    groupPagePreferences.update({ dualWindowEnabled: draft.dualWindowEnabled });
    savedSettingsRef.current = { ...savedSettingsRef.current, dualWindowEnabled: draft.dualWindowEnabled };
    onDualWindowEnabledChange(null);
    previewActiveRef.current = false;
    onUnsavedPersonalSettingsGuardChange(null);
    if (draft.usePersonalGithub !== savedSettingsRef.current.usePersonalGithub) {
      preferenceMutation.mutate(draft.usePersonalGithub);
    }
    setShowPersonalSettings(false);
  };

  const handleTogglePersonalSettings = () => {
    if (showPersonalSettings) discardPersonalSettings();
    setShowPersonalSettings((value) => !value);
  };

  // 그룹 수정은 그룹장이 기본이지만, 운영 카테고리 그룹은 운영진도 할 수 있다
  // (GROUP_BUSINESS_RULES.md §4-2: "그룹장 (운영 카테고리 그룹은 운영진도 가능)").
  const canEditGroupInfo = isLeader || (isManager && info.category === GroupCategory.MANAGE);

  const openEditor = () => {
    if (!canEditGroupInfo) {
      window.alert("그룹장만 그룹 정보를 변경할 수 있습니다.");
      return;
    }
    if (info.status === GroupStatus.SUCCESS || info.status === GroupStatus.FAIL) {
      window.alert("활동이 종료된 그룹의 정보는 변경할 수 없습니다.");
      return;
    }
    if (showPersonalSettings) handleCancelPersonalSettings();
    onStartEdit();
  };

  const toggleStatusActions = () => {
    if (!isLeader) {
      window.alert("그룹장만 그룹 상태를 변경할 수 있습니다.");
      return;
    }
    setShowStatus((value) => !value);
  };

  // 진행 → 종료(성공/실패)는 그룹장 또는 운영진이 변경할 수 있다(진행 → 중단과 달리 운영진
  // 전용이 아니다) — tasks/group/GROUP_BUSINESS_RULES.md §3 상태 전이 규칙. 그래서 "그룹 상태
  // 변경"(그룹장용)과 "운영진 전용" 두 패널에 같은 버튼이 중복해서 있다.
  const endGroup = (status: typeof GroupStatus.SUCCESS | typeof GroupStatus.FAIL) => {
    if (!isLeader && !isManager) {
      window.alert("그룹장 또는 운영진만 그룹 상태를 변경할 수 있습니다.");
      return;
    }
    if (action.isPending || info.status !== GroupStatus.PROGRESS) return;
    const result = status === GroupStatus.SUCCESS ? "성공" : "실패";
    if (!window.confirm(`"${info.title}" 그룹의 활동을 ${result}으로 종료하시겠습니까?`)) return;
    action.mutate(() => GroupSettingsApi.updateGroupState(info.id, { status }), {
      // 그룹장용/운영진용 두 패널 어느 쪽에서 눌렀는지 모르니 둘 다 접는다 — 이미 닫혀 있던
      // 쪽은 아무 효과 없다.
      onSuccess: () => { setShowStatus(false); setShowManagerSettings(false); },
    });
  };

  const leaveGroup = () => {
    if (action.isPending) return;
    if (!window.confirm(`"${info.title}" 그룹에서 나가시겠습니까?`)) return;
    action.mutate(() => GroupSettingsApi.leaveGroup(info.id));
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.menu} ${!isEditing ? styles.activePane : ""}`} aria-hidden={isEditing}>
        <button type="button" className={styles.menuButton} onClick={openEditor}><SquarePen size={20} aria-hidden="true" />그룹 정보 변경</button>
        <button type="button" className={styles.menuButton} onClick={toggleStatusActions} aria-expanded={isLeader && showStatus}><RefreshCw size={20} aria-hidden="true" />그룹 상태 변경</button>
        {isLeader && <div className={styles.statusActions} data-open={showStatus} aria-hidden={!showStatus}>
          <div className={styles.statusActionContent}>
            {info.status !== GroupStatus.PROGRESS && <p className={styles.statusHint}>진행 중인 그룹만 활동을 종료할 수 있습니다.</p>}
            <button type="button" className={`${styles.statusAction} ${styles.successAction}`} disabled={!showStatus || action.isPending || info.status !== GroupStatus.PROGRESS} onClick={() => endGroup(GroupStatus.SUCCESS)}>성공으로 활동 종료</button>
            <button type="button" className={`${styles.statusAction} ${styles.failAction}`} disabled={!showStatus || action.isPending || info.status !== GroupStatus.PROGRESS} onClick={() => endGroup(GroupStatus.FAIL)}>실패로 활동 종료</button>
          </div>
        </div>}
        <button type="button" className={styles.menuButton} onClick={handleTogglePersonalSettings} aria-expanded={showPersonalSettings}><Settings2 size={20} aria-hidden="true" />개인 설정</button>
        <div className={styles.statusActions} data-open={showPersonalSettings} aria-hidden={!showPersonalSettings}>
          <div className={styles.statusActionContent}>
            <p className={styles.statusHint}>변경한 설정은 즉시 임시 적용됩니다. 저장하지 않고 패널을 닫으면 원래 설정으로 돌아갑니다.</p>
            <SettingToggleRow label="듀얼 윈도우 기능 사용" description="두 개의 창을 나란히 사용할 수 있습니다. 끄면 한 개의 창만 사용합니다." isRightSelected={draft.dualWindowEnabled} {...booleanToggleSides((value) => updateDraft((current) => ({ ...current, dualWindowEnabled: value })))} />
            {/* 그룹 단위가 아니라 전역 설정 — 멤버 마이페이지가 아직 마이그레이션 전이라 임시로 여기 둔다. */}
            <SettingToggleRow
              label="깃허브 API 개인 사용량 사용"
              description={"조회 제한이 시간당 500회에서 5,000회로 늘어나며, 개인 비공개 저장소도 조회할 수 있습니다. 비공개 저장소의 조회 결과는 백엔드에 캐싱되지 않아, 같은 리소스를 다시 조회해도 API 사용량이 소모될 수 있습니다.\n\n이 개인 설정은 사용자의 모든 그룹에서 동일하게 적용됩니다. 이 설정을 사용하다 비활성화하면, 그로부터 7일 동안 다시 활성화할 수 없습니다."}
              isRightSelected={draft.usePersonalGithub}
              {...booleanToggleSides((value) => updateDraft((current) => ({ ...current, usePersonalGithub: value })))}
            />
            {/* 취소/저장 버튼은 그룹 정보 변경 패널(GroupInfoEditor)과 같은 .footer/.cancelButton/.saveButton 스타일을 그대로 쓴다. */}
            <div className={styles.footer}>
              <button type="button" className={styles.cancelButton} onClick={handleCancelPersonalSettings}>취소</button>
              <button type="button" className={styles.saveButton} disabled={preferenceMutation.isPending} onClick={handleSavePersonalSettings}>저장</button>
            </div>
          </div>
        </div>
        {isManager && <>
          <button type="button" className={styles.menuButton} onClick={() => setShowManagerSettings((value) => !value)} aria-expanded={showManagerSettings}><ShieldAlert size={20} aria-hidden="true" />운영진 전용</button>
          <div className={styles.statusActions} data-open={showManagerSettings} aria-hidden={!showManagerSettings}>
            <div className={styles.statusActionContent}>
              {/* 진행 → 종료(성공/실패)는 그룹장용 패널과 동일하게 운영진도 가능 — 버튼을 그대로 복사했다. */}
              {info.status !== GroupStatus.PROGRESS && <p className={styles.statusHint}>진행 중인 그룹만 활동을 종료할 수 있습니다.</p>}
              <button type="button" className={`${styles.statusAction} ${styles.successAction}`} disabled={!showManagerSettings || action.isPending || info.status !== GroupStatus.PROGRESS} onClick={() => endGroup(GroupStatus.SUCCESS)}>성공으로 활동 종료</button>
              <button type="button" className={`${styles.statusAction} ${styles.failAction}`} disabled={!showManagerSettings || action.isPending || info.status !== GroupStatus.PROGRESS} onClick={() => endGroup(GroupStatus.FAIL)}>실패로 활동 종료</button>
              <button type="button" className={`${styles.statusAction} ${styles.failAction}`}>그룹 정지</button>
            </div>
          </div>
        </>}
        <button type="button" className={styles.menuButton}><BookOpen size={20} aria-hidden="true" />사용법 튜토리얼</button>
        <button type="button" className={styles.menuButton} disabled={action.isPending} onClick={leaveGroup}><LogOut size={20} aria-hidden="true" />그룹 나가기</button>
      </div>
      <GroupInfoEditor
        info={info}
        isManager={isManager}
        isLeader={isLeader}
        isEditing={isEditing}
        titleDraft={titleDraft}
        onCloseEdit={onCloseEdit}
        onSave={onSave}
        onUnsavedGroupInfoGuardChange={onUnsavedGroupInfoGuardChange}
      />
    </div>
  );
}
