import { useCurrentUser } from "./useCurrentUser";

export const useIsManager = () => {
  const { status, data } = useCurrentUser();

  return {
    isManager: data?.manager ?? false,
    isLoading: status === "pending",
    isError: status === "error",
  };
};
