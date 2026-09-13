export const getSafeInternalRedirectPath = (redirectPath: string | null) => {
  if (!redirectPath?.startsWith("/") || redirectPath.startsWith("//")) {
    return "/";
  }

  const url = new URL(redirectPath, window.location.origin);

  if (url.origin !== window.location.origin) {
    return "/";
  }

  return `${url.pathname}${url.search}${url.hash}`;
};
