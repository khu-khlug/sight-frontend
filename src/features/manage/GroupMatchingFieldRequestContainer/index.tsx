import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Heading,
  VStack,
  HStack,
  Text,
  NativeSelectRoot,
  NativeSelectField,
} from "@chakra-ui/react";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";
import PageNavigator from "../../../components/PageNavigator";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

import FieldRequestItem from "./FieldRequestItem";

type FilterStatus = "pending" | "approved" | "rejected" | null;

export default function GroupMatchingFieldRequestContainer() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");

  const limit = 20;
  const offset = (page - 1) * limit;

  const { status, data, error, refetch } = useQuery({
    queryKey: ["group-matching-field-requests", page, filterStatus],
    queryFn: () =>
      GroupMatchingManageApi.listFieldRequests({
        status: filterStatus,
        limit,
        offset,
      }),
    retry: 0,
  });

  const { mutateAsync: approveRequest } = useMutation({
    mutationFn: (id: string) =>
      GroupMatchingManageApi.approveFieldRequest(id),
    onSuccess: () => {
      refetch();
    },
  });

  const { mutateAsync: rejectRequest } = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      GroupMatchingManageApi.rejectFieldRequest(id, {
        rejectReason: reason,
      }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleApprove = async (requestId: string, fieldName: string) => {
    if (!confirm(`"${fieldName}" 분야를 승인하시겠습니까?`)) {
      return;
    }

    try {
      await approveRequest(requestId);
      alert("요청이 승인되었습니다.");
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  const handleReject = async (requestId: string) => {
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason) {
      return;
    }

    try {
      await rejectRequest({ id: requestId, reason });
      alert("요청이 거부되었습니다.");
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  return (
    <>
      <Container>
        <Heading as="h2" size="lg" mb={5}>
          분야 추가 요청
        </Heading>

        <HStack gap={4} mb={5}>
          <VStack align="stretch" gap={2} flex={1} maxW="300px">
            <Text fontWeight="medium" fontSize="sm">
              상태
            </Text>
            <NativeSelectRoot>
              <NativeSelectField
                value={filterStatus || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterStatus(
                    value === "" ? null : (value as FilterStatus)
                  );
                  setPage(1);
                }}
              >
                <option value="">전체</option>
                <option value="pending">대기</option>
                <option value="approved">승인</option>
                <option value="rejected">거부</option>
              </NativeSelectField>
            </NativeSelectRoot>
          </VStack>
        </HStack>
      </Container>

      <Container>
        {(() => {
          switch (status) {
            case "pending":
              return <CenterRingLoadingIndicator />;
            case "error":
              return (
                <Callout type="error">{extractErrorMessage(error)}</Callout>
              );
            case "success":
              return (
                <>
                  <Heading as="h3" size="md" mb={4}>
                    총 <Text as="span" color="brand.500">{data.count}개</Text> 요청
                  </Heading>
                  <VStack gap={4} align="stretch" mb={5}>
                    {data.requests.map((request) => (
                      <FieldRequestItem
                        key={request.id}
                        request={request}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                  </VStack>
                  <PageNavigator
                    currentPage={page}
                    countPerPage={limit}
                    totalCount={data.count}
                    onPageChange={(page) => setPage(page)}
                  />
                </>
              );
          }
        })()}
      </Container>
    </>
  );
}
