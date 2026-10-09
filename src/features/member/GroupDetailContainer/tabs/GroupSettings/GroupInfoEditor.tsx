import { GroupSettingsApi } from "../../../../../api/public/group/GroupSettingsApi";
import { useGroupAction } from "../../../../../hooks/group/useGroupAction";
import { Badge, ScrollArea } from "@chakra-ui/react";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import GitRepoBadge from "../../../../../components/GitRepoBadge";
import AppTooltip from "../../../../../components/AppTooltip";
import { GROUP_CATEGORY_ICON } from "../../../../../components/GroupCategoryBadge";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import TechBadge from "../../../../../components/TechBadge";
import { GroupCategory, GroupCategoryLabel, GroupInterest, GroupInterestLabel, GroupVisibility, GroupVisibilityLabel } from "../../../../../constant";
import { useUnsavedChangesBeforeUnload } from "../../../../../hooks/useUnsavedChangesBeforeUnload";
import { GROUP_INTEREST_ICON, GroupInfo } from "../GroupInfo/types";
import styles from "./style.module.css";

export type EditableGroupInfo = Pick<GroupInfo,
  "title" | "category" | "description" | "interests" | "techStack" | "repositoryUrls" | "allowJoin" | "visibility">;

type Props = {
  info: GroupInfo;
  isManager: boolean;
  isLeader: boolean;
  isEditing: boolean;
  titleDraft: string;
  onCloseEdit: () => void;
  onSave: (changes: EditableGroupInfo) => void;
  // GroupSettings의 개인설정과 같은 메커니즘 — Dashboard의 탭 전환 confirm 포인터에 이 패널의
  // 확인 함수를 등록/해제한다(GroupSettings를 그대로 통과해서 받는다).
  onUnsavedGroupInfoGuardChange: (confirmLeave: (() => boolean) | null) => void;
};

type Draft = Omit<EditableGroupInfo, "title">;

const makeDraft = (info: GroupInfo): Draft => ({
  category: info.category,
  description: info.description,
  interests: [...info.interests],
  techStack: [...info.techStack],
  repositoryUrls: [...info.repositoryUrls],
  allowJoin: info.allowJoin,
  visibility: info.visibility,
});

const VISIBILITY_DESCRIPTION: Record<GroupVisibility, string> = {
  [GroupVisibility.PRIVATE]: "그룹 멤버만 볼 수 있습니다.",
  [GroupVisibility.MANAGER_ONLY]: "운영진만 볼 수 있으며, 운영진만 설정할 수 있습니다.",
  [GroupVisibility.MEMBER_ONLY]: "재학·휴학·졸업 상태의 KHLUG 회원이 볼 수 있습니다.",
  [GroupVisibility.PUBLIC]: "교류 회원을 포함한 모든 로그인 회원이 볼 수 있습니다.",
};

const MEMBER_CATEGORIES: GroupCategory[] = [GroupCategory.STUDY, GroupCategory.PROJECT, GroupCategory.DOCUMENTATION];

const FORM_TRANSITION_MS = 180;

function useFormPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);

  useLayoutEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timeout = window.setTimeout(() => setMounted(false), FORM_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [open, mounted]);

  return mounted;
}

export default function GroupInfoEditor({ info, isManager, isLeader, isEditing, titleDraft, onCloseEdit, onSave, onUnsavedGroupInfoGuardChange }: Props) {
  const action = useGroupAction(info.id);
  const [draft, setDraft] = useState<Draft>(() => makeDraft(info));
  const [newTech, setNewTech] = useState<string | null>(null);
  const [newRepository, setNewRepository] = useState<string | null>(null);
  const [editingRepository, setEditingRepository] = useState<string | null>(null);
  const [repositoryEditValue, setRepositoryEditValue] = useState("");
  const showTechField = useFormPresence(newTech !== null);
  const showRepositoryAddField = useFormPresence(newRepository !== null);
  const showRepositoryEditField = useFormPresence(editingRepository !== null);
  const [displayedRepositoryEdit, setDisplayedRepositoryEdit] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const techInputRef = useRef<HTMLTextAreaElement>(null);
  const repositoryInputRef = useRef<HTMLTextAreaElement>(null);
  const repositoryEditInputRef = useRef<HTMLTextAreaElement>(null);
  const techAddFieldRef = useRef<HTMLSpanElement>(null);
  const repositoryAddFieldRef = useRef<HTMLSpanElement>(null);
  const repositoryEditFieldRef = useRef<HTMLSpanElement>(null);
  const wasEditing = useRef(isEditing);

  useLayoutEffect(() => {
    const opening = isEditing && !wasEditing.current;
    wasEditing.current = isEditing;
    if (!opening) return;
    setDraft(makeDraft(info));
    setNewTech(null);
    setNewRepository(null);
    setEditingRepository(null);
    setDisplayedRepositoryEdit(null);
  }, [isEditing, info]);

  // 저장 안 하고 닫으려 하면("취소" 또는 다른 설정 탭으로 전환) 확인한다 — 확인만 하고 따로
  // 되돌리는 코드는 없다. 다음에 다시 열릴 때 위 useLayoutEffect가 항상 info 기준으로 draft를
  // 새로 만들어서(titleDraft도 Dashboard의 handleStartGroupInfoEdit이 매번 groupInfo.title로
  // 새로 세팅), 닫힌 상태에서 보이지도 않는 draft를 굳이 되돌릴 필요가 없다.
  const hasPendingInlineInput = Boolean(newTech?.trim() || newRepository?.trim()
    || (editingRepository && repositoryEditValue !== editingRepository));
  const isDirty = isEditing && (titleDraft.trim() !== info.title
    || JSON.stringify(draft) !== JSON.stringify(makeDraft(info)) || hasPendingInlineInput);
  useUnsavedChangesBeforeUnload(isDirty);
  const confirmLeaveWithoutSaving = () => window.confirm("저장하지 않은 변경 사항은 사라집니다. 계속하시겠습니까?");
  useEffect(() => {
    onUnsavedGroupInfoGuardChange(isDirty ? confirmLeaveWithoutSaving : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);

  const handleCancel = () => {
    if (isDirty && !confirmLeaveWithoutSaving()) return;
    onCloseEdit();
  };

  useLayoutEffect(() => {
    [descriptionRef, techInputRef, repositoryInputRef, repositoryEditInputRef].forEach((ref) => {
      const textarea = ref.current;
      if (!textarea) return;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [draft.description, newTech, newRepository, repositoryEditValue, editingRepository, isEditing]);

  useEffect(() => {
    if (!isEditing || (newTech === null && newRepository === null && editingRepository === null)) return;

    const cancelOnOutsideClick = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (newTech !== null && !techAddFieldRef.current?.contains(event.target)) setNewTech(null);
      if (newRepository !== null && !repositoryAddFieldRef.current?.contains(event.target)) setNewRepository(null);
      if (editingRepository !== null && !repositoryEditFieldRef.current?.contains(event.target)) setEditingRepository(null);
    };

    document.addEventListener("pointerdown", cancelOnOutsideClick);
    return () => document.removeEventListener("pointerdown", cancelOnOutsideClick);
  }, [isEditing, newTech, newRepository, editingRepository]);

  const addTech = () => {
    const value = newTech?.trim();
    if (!value) return;
    setDraft((current) => ({ ...current, techStack: current.techStack.includes(value) ? current.techStack : [...current.techStack, value] }));
    setNewTech(null);
  };

  const addRepository = () => {
    const value = newRepository?.trim();
    if (!value) return;
    setDraft((current) => ({ ...current, repositoryUrls: current.repositoryUrls.includes(value) ? current.repositoryUrls : [...current.repositoryUrls, value] }));
    setNewRepository(null);
  };

  const startRepositoryEdit = (url: string) => {
    setNewRepository(null);
    setEditingRepository(url);
    setDisplayedRepositoryEdit(url);
    setRepositoryEditValue(url);
    requestAnimationFrame(() => repositoryEditInputRef.current?.focus());
  };

  const applyRepositoryEdit = () => {
    const value = repositoryEditValue.trim();
    if (!editingRepository || !value) return;
    setDraft((current) => ({
      ...current,
      repositoryUrls: current.repositoryUrls.map((url) => url === editingRepository ? value : url),
    }));
    setDisplayedRepositoryEdit(value);
    setEditingRepository(null);
  };

  const toggleInterest = (interest: GroupInterest) => {
    setDraft((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((value) => value !== interest)
        : [...current.interests, interest],
    }));
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // GroupSettings.openEditor의 canEditGroupInfo와 같은 조건 — 그룹장이 기본이지만 운영
    // 카테고리 그룹은 운영진도 저장할 수 있다(GROUP_BUSINESS_RULES.md §4-2).
    if (!isLeader && !(isManager && info.category === GroupCategory.MANAGE)) {
      window.alert("그룹장만 그룹 정보를 변경할 수 있습니다.");
      onCloseEdit();
      return;
    }
    const title = titleDraft.trim();
    if (!title) return;
    const changes = {
      title,
      category: draft.category,
      description: draft.description.trim(),
      interests: draft.interests,
      techStack: draft.techStack,
      repositoryUrls: draft.repositoryUrls,
      allowJoin: draft.allowJoin,
      visibility: draft.visibility,
    };
    action.mutate(() => GroupSettingsApi.updateGroup(info.id, changes), { onSuccess: () => { onSave(changes); onCloseEdit(); } });
  };

  return (
    <form className={`${styles.editor} ${isEditing ? styles.activePane : ""}`} aria-hidden={!isEditing} onSubmit={handleSave}>
      <ScrollArea.Root className={styles.scrollArea} size="sm" variant="hover">
        <ScrollArea.Viewport h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" px="15px" pb="20px">
            <label className={styles.descriptionField}>
              <span>그룹 설명</span>
              <textarea
                ref={descriptionRef}
                className={styles.textarea}
                value={draft.description}
                onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                rows={1}
                placeholder="그룹 설명을 입력하세요"
              />
            </label>
            <fieldset className={styles.categoryField} aria-label="그룹 카테고리">
              <legend className={styles.categoryLabel}>그룹 카테고리</legend>
              <div className={styles.categoryOptions}>
                {Object.values(GroupCategory)
                  .filter((category) => isManager || MEMBER_CATEGORIES.includes(category))
                  .map((category) => {
                    const Icon = GROUP_CATEGORY_ICON[category];
                    const isSelected = draft.category === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        className={`${styles.categoryButton} ${isSelected ? styles.selectedOption : styles.unselectedOption}`}
                        aria-pressed={isSelected}
                        onClick={() => setDraft((current) => ({
                          ...current,
                          category,
                          visibility: category !== GroupCategory.MANAGE && current.visibility === GroupVisibility.MANAGER_ONLY
                            ? GroupVisibility.MEMBER_ONLY
                            : current.visibility,
                        }))}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span>{GroupCategoryLabel[category]}</span>
                      </button>
                    );
                  })}
              </div>
            </fieldset>
            <div className={styles.rowGroup}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>관심 분야</span>
                <fieldset className={styles.options} aria-label="관심 분야">
                  {Object.values(GroupInterest).map((interest) => {
                    const Icon = GROUP_INTEREST_ICON[interest];
                    const isSelected = draft.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        className={`${styles.option} ${styles.choiceOption} ${styles.interestOption} ${isSelected ? styles.selectedOption : styles.unselectedOption}`}
                        aria-pressed={isSelected}
                        onClick={() => toggleInterest(interest)}
                      >
                        <Icon size={14} aria-hidden="true" />
                        <span>{GroupInterestLabel[interest]}</span>
                      </button>
                    );
                  })}
                </fieldset>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>사용 기술</span>
                <div className={styles.tagList}>
                  {draft.techStack.map((slug) => (
                    <span key={slug} className={styles.editableTag}>
                      <TechBadge slug={slug} trailingAction={
                        <button type="button" className={styles.removeButton} aria-label={`${slug} 삭제`} onClick={() => setDraft((current) => ({ ...current, techStack: current.techStack.filter((item) => item !== slug) }))}><X size={13} /></button>
                      } />
                    </span>
                  ))}
                  {!showTechField ? (
                    <Badge display="inline-flex" alignItems="center" size="sm" bg="blackAlpha.50" className={styles.addBadge}>
                      <button type="button" className={styles.addButton} aria-label="사용 기술 추가" onClick={() => { setNewTech(""); requestAnimationFrame(() => techInputRef.current?.focus()); }}><Plus size={16} /></button>
                    </Badge>
                  ) : (
                    <span ref={techAddFieldRef} className={`${styles.addField} ${newTech !== null ? styles.formEnter : styles.formExit}`}>
                      <textarea ref={techInputRef} className={styles.inlineInput} rows={1} value={newTech ?? ""} placeholder="기술 이름" aria-label="새 사용 기술" onChange={(event) => setNewTech(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTech(); } else if (event.key === "Escape") setNewTech(null); }} />
                      <button type="button" aria-label="사용 기술 추가 완료" disabled={!newTech?.trim()} onClick={addTech}><Check size={15} /></button>
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>저장소</span>
                <div className={styles.repositoryList}>
                  {draft.repositoryUrls.map((url) => (
                    <div key={url} className={`${styles.editableTag} ${showRepositoryEditField && displayedRepositoryEdit === url ? styles.editingTag : ""}`}>
                      {showRepositoryEditField && displayedRepositoryEdit === url ? (
                        <span ref={repositoryEditFieldRef} className={`${styles.addField} ${editingRepository === url ? styles.formEnter : styles.formExit}`}>
                          <textarea ref={repositoryEditInputRef} className={styles.inlineInput} rows={1} value={repositoryEditValue} aria-label="저장소 URL 수정" onChange={(event) => setRepositoryEditValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyRepositoryEdit(); } else if (event.key === "Escape") setEditingRepository(null); }} />
                          <button type="button" aria-label="저장소 수정 완료" disabled={!repositoryEditValue.trim()} onClick={applyRepositoryEdit}><Check size={15} /></button>
                        </span>
                      ) : (
                        <GitRepoBadge url={url} onEdit={() => startRepositoryEdit(url)} trailingAction={
                          <button type="button" className={styles.removeButton} aria-label={`${url} 삭제`} onClick={() => setDraft((current) => ({ ...current, repositoryUrls: current.repositoryUrls.filter((item) => item !== url) }))}><X size={13} /></button>
                        } />
                      )}
                    </div>
                  ))}
                  {!showRepositoryAddField ? (
                    <Badge display="inline-flex" alignItems="center" size="sm" bg="blackAlpha.50" className={styles.addBadge}>
                      <button type="button" className={styles.addButton} aria-label="저장소 추가" onClick={() => { setNewRepository(""); requestAnimationFrame(() => repositoryInputRef.current?.focus()); }}><Plus size={16} /></button>
                    </Badge>
                  ) : (
                    <span ref={repositoryAddFieldRef} className={`${styles.addField} ${newRepository !== null ? styles.formEnter : styles.formExit}`}>
                      <textarea ref={repositoryInputRef} className={styles.inlineInput} rows={1} value={newRepository ?? ""} placeholder="저장소 URL" aria-label="새 저장소 URL" onChange={(event) => setNewRepository(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRepository(); } else if (event.key === "Escape") setNewRepository(null); }} />
                      <button type="button" aria-label="저장소 추가 완료" disabled={!newRepository?.trim()} onClick={addRepository}><Check size={15} /></button>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={`${styles.rowGroup} ${styles.separated}`}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>참여 신청</span>
                <div className={styles.toggle} role="group" aria-label="참여 신청" data-right-selected={!draft.allowJoin}>
                  <button
                    type="button"
                    className={draft.allowJoin ? styles.selected : undefined}
                    aria-pressed={draft.allowJoin}
                    onClick={() => setDraft((current) => ({ ...current, allowJoin: true }))}
                  >가능</button>
                  <button
                    type="button"
                    className={!draft.allowJoin ? styles.selected : undefined}
                    aria-pressed={!draft.allowJoin}
                    onClick={() => setDraft((current) => ({ ...current, allowJoin: false }))}
                  >불가능</button>
                </div>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>공개 범위</span>
                <fieldset className={styles.options} aria-label="공개 범위">
                  {/* "운영진 공개"는 운영 카테고리에서만 뜰 수 있을 뿐 아니라, 누가 설정할 수
                      있는지도 운영진으로 제한된다(GROUP_BUSINESS_RULES.md §2 공개 범위:
                      "운영진 공개 | 운영진만 | 운영진만") — 카테고리 조건만으로는 그룹장이지만
                      운영진이 아닌 사용자도 고를 수 있어서 isManager를 같이 본다. */}
                  {Object.values(GroupVisibility)
                    .filter((visibility) => visibility !== GroupVisibility.MANAGER_ONLY || (draft.category === GroupCategory.MANAGE && isManager))
                    .map((visibility) => (
                      <AppTooltip key={visibility} content={VISIBILITY_DESCRIPTION[visibility]}>
                        <button
                          type="button"
                          className={`${styles.option} ${styles.choiceOption} ${draft.visibility === visibility ? styles.selectedOption : styles.unselectedVisibility}`}
                          aria-pressed={draft.visibility === visibility}
                          onClick={() => setDraft((current) => ({ ...current, visibility }))}
                        >{GroupVisibilityLabel[visibility]}</button>
                      </AppTooltip>
                    ))}
                </fieldset>
              </div>
            </div>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
      <div className={styles.footer}>
        <button type="button" className={styles.cancelButton} onClick={handleCancel}>취소</button>
        <button type="submit" className={styles.saveButton} disabled={!titleDraft.trim() || action.isPending}>저장</button>
      </div>
    </form>
  );
}
