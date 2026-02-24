import { useMutation } from "@tanstack/react-query";
import { UserPublicApi } from "../../api/public/user";

export const useCheckFirstTodayLogin = () => {
  return useMutation({
    mutationFn: UserPublicApi.checkFirstTodayLogin,
    onError: (error) => {
      console.error("일일 첫 방문 체크 실패", error);
    },
  });
};
