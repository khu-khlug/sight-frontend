import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Flex, Heading, VStack, HStack, Box, Text, Badge } from "@chakra-ui/react";

import Container from "../../../components/Container";
import Button from "../../../components/Button";
import Callout from "../../../components/Callout";
import CenterRingLoadingIndicator from "../../../components/RingLoadingIndicator/center";

import { GroupMatchingManageApi } from "../../../api/manage/groupMatching";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats, formatDate } from "../../../util/date";

import CreateFieldModal from "./CreateFieldModal";

export default function GroupMatchingFieldManagementContainer() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    status,
    data: fields,
    error,
    refetch,
  } = useQuery({
    queryKey: ["group-matching-fields-admin"],
    queryFn: GroupMatchingManageApi.listFields,
    retry: 0,
  });

  // 미처리 관심 분야 요청 개수 조회
  const { data: pendingRequestsData } = useQuery({
    queryKey: ["group-matching-field-requests-pending-count"],
    queryFn: () =>
      GroupMatchingManageApi.listFieldRequests({
        status: "pending",
        limit: 1000,
        offset: 0,
      }),
    retry: 0,
  });

  const pendingCount = pendingRequestsData?.count || 0;

  const { mutateAsync: obsoleteField } = useMutation({
    mutationFn: GroupMatchingManageApi.obsoleteField,
    onSuccess: () => {
      refetch();
    },
  });

  const handleObsolete = async (fieldId: string, fieldName: string) => {
    if (!confirm(`"${fieldName}" 분야를 비활성화하시겠습니까?`)) {
      return;
    }

    try {
      await obsoleteField(fieldId);
      alert("분야가 비활성화되었습니다.");
    } catch (error) {
      alert(extractErrorMessage(error as Error));
    }
  };

  const handleGoToFieldRequests = () => {
    navigate("/manage/group-matching-field-requests");
  };

  return (
    <>
      <Container>
        <Flex justify="space-between" align="center" mb={5}>
          <Heading as="h2" size="lg">
            관심 분야 관리
          </Heading>
          <HStack gap={3}>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              분야 추가
            </Button>
            <Button variant="neutral" onClick={handleGoToFieldRequests}>
              관심 분야 요청 목록
              {pendingCount > 0 && (
                <Badge
                  ml={2}
                  colorPalette="red"
                  variant="solid"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  fontSize="xs"
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </HStack>
        </Flex>

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
                <VStack gap={3} align="stretch">
                  {fields.map((field) => (
                    <Box
                      key={field.id}
                      p={4}
                      bg={field.obsoletedAt ? "gray.100" : "white"}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      opacity={field.obsoletedAt ? 0.6 : 1}
                    >
                      <VStack align="start" gap={1}>
                        <Text fontWeight="semibold" fontSize="md">
                          {field.name}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {field.createdAt && (
                            <>
                              생성:{" "}
                              {formatDate(
                                new Date(field.createdAt),
                                DateFormats.DATE_KOR
                              )}
                            </>
                          )}
                          {field.obsoletedAt && (
                            <>
                              {field.createdAt && " · "}
                              비활성화:{" "}
                              {formatDate(
                                new Date(field.obsoletedAt),
                                DateFormats.DATE_KOR
                              )}
                            </>
                          )}
                        </Text>
                      </VStack>
                      {!field.obsoletedAt && (
                        <Button
                          variant="neutral"
                          onClick={() => handleObsolete(field.id, field.name)}
                        >
                          비활성화
                        </Button>
                      )}
                    </Box>
                  ))}
                </VStack>
              );
          }
        })()}
      </Container>

      {isCreateModalOpen && (
        <CreateFieldModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
}
