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
      // 400·404는 대상이 삭제됐거나 그룹 상태가 바뀐 경우가 많다. 다시 조회해 보드에서 사라진 카드의 창은
      // 컨테이너가 닫고, 바뀐 그룹 상태로 버튼을 다시 그린다.
      if (isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 404)) {
        void client.invalidateQueries({ queryKey: ["group-detail", groupId] });
      }
    },
  });
}
