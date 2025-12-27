import { Box, VStack, HStack, Text, Badge } from "@chakra-ui/react";

import Button from "../../../../components/Button";
import { GroupMatchingManageApiDto } from "../../../../api/manage/groupMatching";
import { DateFormats, formatDate } from "../../../../util/date";

type Props = {
  request: GroupMatchingManageApiDto["GroupMatchingFieldRequestDto"];
  onApprove: (id: string, fieldName: string) => void;
  onReject: (id: string) => void;
};

export default function FieldRequestItem({
  request,
  onApprove,
  onReject,
}: Props) {
  const isPending = !request.approvedAt && !request.rejectedAt;
  const isApproved = !!request.approvedAt;
  const isRejected = !!request.rejectedAt;

  const getBgColor = () => {
    if (isPending) return "yellow.50";
    if (isApproved) return "green.50";
    if (isRejected) return "red.50";
    return "white";
  };

  const getBadgeColor = () => {
    if (isPending) return "yellow";
    if (isApproved) return "green";
    if (isRejected) return "red";
    return "gray";
  };

  return (
    <Box
      p={4}
      bg={getBgColor()}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" fontSize="md">
          {request.requesterName}
        </Text>
        <Badge
          colorPalette={getBadgeColor()}
          variant="solid"
          borderRadius="md"
          px={3}
          py={1}
        >
          {isPending && "대기"}
          {isApproved && "승인"}
          {isRejected && "거부"}
        </Badge>
      </HStack>

      <VStack align="stretch" gap={2}>
        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="100px">
            분야 이름:
          </Text>
          <Text fontWeight="semibold">{request.fieldName}</Text>
        </HStack>

        <HStack align="start">
          <Text fontWeight="medium" color="gray.600" minW="100px">
            요청 사유:
          </Text>
          <Text>{request.requestReason}</Text>
        </HStack>

        <HStack>
          <Text fontWeight="medium" color="gray.600" minW="100px">
            요청 일시:
          </Text>
          <Text>
            {formatDate(new Date(request.createdAt), DateFormats.DATE_KOR)}
          </Text>
        </HStack>

        {isApproved && (
          <HStack>
            <Text fontWeight="medium" color="gray.600" minW="100px">
              승인 일시:
            </Text>
            <Text>
              {formatDate(
                new Date(request.approvedAt!),
                DateFormats.DATE_KOR
              )}
            </Text>
          </HStack>
        )}

        {isRejected && (
          <>
            <HStack>
              <Text fontWeight="medium" color="gray.600" minW="100px">
                거부 일시:
              </Text>
              <Text>
                {formatDate(
                  new Date(request.rejectedAt!),
                  DateFormats.DATE_KOR
                )}
              </Text>
            </HStack>
            <HStack align="start">
              <Text fontWeight="medium" color="gray.600" minW="100px">
                거부 사유:
              </Text>
              <Text>{request.rejectReason}</Text>
            </HStack>
          </>
        )}
      </VStack>

      {isPending && (
        <HStack gap={3} mt={4}>
          <Button onClick={() => onApprove(request.id, request.fieldName)}>
            승인
          </Button>
          <Button variant="neutral" onClick={() => onReject(request.id)}>
            거부
          </Button>
        </HStack>
      )}
    </Box>
  );
}
