import { createContext, useContext, useState, type ReactNode } from "react";
import { useCurrentUser } from "../../../hooks/user/useCurrentUser";

type AssigneeFilterState = {
  onlyAssignedToMe: boolean;
  currentUserId: number | undefined;
  canFilter: boolean;
  setOnlyAssignedToMe: (enabled: boolean) => void;
};

const AssigneeFilterContext = createContext<AssigneeFilterState | null>(null);

export function AssigneeFilterProvider({ children }: { children: ReactNode }) {
  const [onlyAssignedToMe, setOnlyAssignedToMe] = useState(false);
  const { data: currentUser } = useCurrentUser();
  return (
    <AssigneeFilterContext.Provider value={{ onlyAssignedToMe, setOnlyAssignedToMe, currentUserId: currentUser?.id, canFilter: currentUser !== undefined }}>
      {children}
    </AssigneeFilterContext.Provider>
  );
}

export function useAssigneeFilter() {
  const value = useContext(AssigneeFilterContext);
  if (!value) throw new Error("담당자 필터는 그룹 상세 페이지 안에서 사용해야 합니다.");
  return value;
}

export function isOtherAssignee(assigneeUserId: number | null, onlyAssignedToMe: boolean, currentUserId: number | undefined): boolean {
  return onlyAssignedToMe && (currentUserId === undefined || assigneeUserId !== currentUserId);
}
