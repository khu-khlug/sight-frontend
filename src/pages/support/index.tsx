import { Box, Center, Heading, NativeSelect, Spinner, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { SupportRequestCategory, supportRequestCategories } from "../../api/supportRequest";
import Button from "../../components/Button";
import Callout from "../../components/Callout";
import Container from "../../components/Container";
import PageNavigator from "../../components/PageNavigator";
import { supportRequestCategoryLabels } from "../../features/support/category";
import { useSupportRequests } from "../../hooks/supportRequest/useSupportRequests";
import MainLayout from "../../layouts/MainLayout";
import { extractErrorMessage } from "../../util/extractErrorMessage";

const LIMIT = 20;

const formatDateTime = (value: string) => new Date(value).toLocaleString("ko-KR");

export default function SupportRequestListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<SupportRequestCategory | "">("");
  const request = {
    offset: (page - 1) * LIMIT,
    limit: LIMIT,
    ...(category ? { category } : {}),
  };
  const supportRequestsQuery = useSupportRequests(request);

  const changeCategory = (value: SupportRequestCategory | "") => {
    setCategory(value);
    setPage(1);
  };

  return (
    <MainLayout>
      <Box mt={{ base: 4, md: 6 }}>
        <Container>
          <Box as="main" py={6}>
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={3} mb={5} flexWrap="wrap">
            <Heading size="xl">지원 신청</Heading>
            <Button onClick={() => navigate("/support/new")}>지원 신청 등록</Button>
          </Box>

          <Box maxW="240px" mb={5}>
            <label htmlFor="support-category-filter">카테고리</label>
            <NativeSelect.Root mt={1}>
              <NativeSelect.Field
                id="support-category-filter"
                value={category}
                onChange={(event) => changeCategory(event.target.value as SupportRequestCategory | "")}
              >
                <option value="">전체</option>
                {supportRequestCategories.map((item) => (
                  <option key={item} value={item}>{supportRequestCategoryLabels[item]}</option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Box>

          {supportRequestsQuery.isPending && (
            <Center py={10}><Spinner size="xl" /></Center>
          )}
          {supportRequestsQuery.isError && <Callout type="error">{extractErrorMessage(supportRequestsQuery.error)}</Callout>}
          {supportRequestsQuery.data && (
            <>
              {supportRequestsQuery.data.supportRequests.length === 0 ? (
                <Callout type="info">등록된 지원 신청이 없습니다.</Callout>
              ) : (
                <VStack align="stretch" gap={3}>
                  {supportRequestsQuery.data.supportRequests.map((supportRequest) => (
                    <Box key={supportRequest.id} borderWidth="1px" borderRadius="md" p={4} bg="white">
                      <Box display="flex" justifyContent="space-between" gap={3} flexWrap="wrap">
                        <Text fontWeight="bold">{supportRequestCategoryLabels[supportRequest.category]}</Text>
                        <Text fontSize="sm" color="gray.600">{formatDateTime(supportRequest.createdAt)}</Text>
                      </Box>
                      <Text asChild fontSize="lg" fontWeight="semibold" mt={2}>
                        <Link to={`/support/${supportRequest.id}`}>{supportRequest.title}</Link>
                      </Text>
                      <Text mt={2} whiteSpace="pre-wrap" lineClamp={2}>{supportRequest.content}</Text>
                      <Text mt={3} fontSize="sm" color="gray.600">
                        신청자 {supportRequest.requester.name} · 댓글 {supportRequest.hasComments ? "있음" : "없음"}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
              <Box mt={6}>
                <PageNavigator
                  currentPage={page}
                  countPerPage={LIMIT}
                  totalCount={supportRequestsQuery.data.count}
                  onPageChange={setPage}
                />
              </Box>
            </>
          )}
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
