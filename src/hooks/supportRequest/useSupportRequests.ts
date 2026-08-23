import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ListSupportRequestsRequest,
  SupportRequestApi,
  SupportRequestInput,
} from "../../api/supportRequest";

export const supportRequestKeys = {
  all: ["support-requests"] as const,
  detail: (supportRequestId: string) => [...supportRequestKeys.all, supportRequestId] as const,
};

export const useSupportRequests = (request: ListSupportRequestsRequest) =>
  useQuery({
    queryKey: [...supportRequestKeys.all, request],
    queryFn: () => SupportRequestApi.listSupportRequests(request),
    retry: 0,
  });

export const useSupportRequest = (supportRequestId: string) =>
  useQuery({
    queryKey: supportRequestKeys.detail(supportRequestId),
    queryFn: () => SupportRequestApi.getSupportRequest(supportRequestId),
    enabled: supportRequestId.length > 0,
    retry: 0,
  });

export const useCreateSupportRequest = () =>
  useMutation({
    mutationFn: (input: SupportRequestInput) => SupportRequestApi.createSupportRequest(input),
  });

export const useUpdateSupportRequest = () =>
  useMutation({
    mutationFn: ({ supportRequestId, input }: { supportRequestId: string; input: SupportRequestInput }) =>
      SupportRequestApi.updateSupportRequest(supportRequestId, input),
  });

export const useDeleteSupportRequest = () =>
  useMutation({
    mutationFn: (supportRequestId: string) => SupportRequestApi.deleteSupportRequest(supportRequestId),
  });

export const useCreateSupportRequestComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supportRequestId, content }: { supportRequestId: string; content: string }) =>
      SupportRequestApi.createSupportRequestComment(supportRequestId, content),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supportRequestKeys.all }),
        queryClient.invalidateQueries({ queryKey: supportRequestKeys.detail(variables.supportRequestId) }),
      ]);
    },
  });
};
