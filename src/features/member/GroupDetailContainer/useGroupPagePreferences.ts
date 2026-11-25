import { useSyncExternalStore } from "react";

import { groupPagePreferences } from "./groupPagePreferences";

export function useGroupPagePreferences() {
  return useSyncExternalStore(groupPagePreferences.subscribe, groupPagePreferences.getSnapshot, groupPagePreferences.getSnapshot);
}
