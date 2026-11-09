import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

// TODO: 추후에 다른 상태값들도 이쪽으로 리팩터링 필요
export type GroupDetailPageState = {
  textWrap: boolean;
};

function usePageStateValue() {
  const [pageState, setPageState] = useState<GroupDetailPageState>({ textWrap: false });
  const toggleTextWrap = useCallback(() => {
    setPageState((previous) => ({ ...previous, textWrap: !previous.textWrap }));
  }, []);
  return useMemo(() => ({ pageState, toggleTextWrap }), [pageState, toggleTextWrap]);
}

const PageStateContext = createContext<ReturnType<typeof usePageStateValue> | null>(null);

export function GroupDetailPageStateProvider({ children }: { children: ReactNode }) {
  const value = usePageStateValue();
  return <PageStateContext.Provider value={value}>{children}</PageStateContext.Provider>;
}

export function useGroupDetailPageState() {
  const value = useContext(PageStateContext);
  if (!value) throw new Error("GroupDetailPageStateProvider가 필요합니다.");
  return value;
}
