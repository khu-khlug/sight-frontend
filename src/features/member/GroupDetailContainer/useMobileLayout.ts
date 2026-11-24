import { useSyncExternalStore } from "react";

// Keep this breakpoint aligned with the group page's CSS media queries.
const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useMobileLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
}
