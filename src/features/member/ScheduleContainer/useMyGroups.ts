import { useQuery } from "@tanstack/react-query";
import { GroupPublicApi } from "../../../api/public/group";

export const useMyGroups = () => {
  return useQuery({
    queryKey: ["groups", "my"],
    queryFn: () => GroupPublicApi.getMyGroups(),
    select: (data) => data.groups,
  });
};
