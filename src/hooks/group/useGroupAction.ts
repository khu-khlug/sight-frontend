import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "react-toastify";
import { extractErrorMessage } from "../../util/extractErrorMessage";

export function useGroupAction(groupId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    // 활동이 성공하면 중단 그룹이 진행 상태로 복귀할 수 있으므로,
    // 서버가 관리하는 그룹 상태와 해당 탭 데이터를 함께 다시 조회한다.
    onSuccess: () => client.invalidateQueries({ queryKey: ["group-detail", groupId] }),
    onError: (error: Error) => {
      toast.error(extractErrorMessage(error));
      // 대상의 존재 여부와 그룹 상태를 다시 조회하여 가능한 행동을 갱신한다.
      if (isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 404)) {
        void client.invalidateQueries({ queryKey: ["group-detail", groupId] });
      }
    },
  });
}
