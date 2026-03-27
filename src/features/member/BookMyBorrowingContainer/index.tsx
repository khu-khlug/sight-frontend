import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Box, Flex, Text, Button, Heading, Spinner } from "@chakra-ui/react";
import dayjs from "dayjs";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import { BookPublicApi, MyBorrowingItemDto } from "../../../api/public/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats } from "../../../util/date";

function borrowedDays(borrowedAt: string): number {
  return dayjs().diff(dayjs(borrowedAt), "day") + 1;
}

function BorrowingCard({ item }: { item: MyBorrowingItemDto }) {
  const navigate = useNavigate();
  const days = borrowedDays(item.borrowedAt);
  const dateStr = dayjs(item.borrowedAt).format(DateFormats.DATE);

  return (
    <Box borderWidth={1} borderRadius="md" px={4} py={3}>
      <Flex align="center" gap={3}>
        <Box flex={1} minW={0}>
          <Link to={`/book/${item.bookId}`}>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" display="block"
              _hover={{ textDecoration: "underline", color: "blue.500" }}
            >
              {item.title}
            </Text>
          </Link>
          <Text fontSize="xs" color="gray.500" mt={0.5}>
            {dateStr} · {days}일째
          </Text>
        </Box>
        <Button
          size="sm"
          variant="outline"
          flexShrink={0}
          onClick={() =>
            navigate(`/book/scan?action=return&preset=${item.bookId}`)
          }
        >
          반납하기
        </Button>
      </Flex>
    </Box>
  );
}

export default function BookMyBorrowingContainer() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["book", "my"],
    queryFn: BookPublicApi.getMyBorrowing,
  });

  const items = data
    ? [...data.currentBorrowings].sort(
        (a, b) => dayjs(b.borrowedAt).valueOf() - dayjs(a.borrowedAt).valueOf(),
      )
    : [];

  return (
    <Container>
      <Heading size="xl" mb={4}>
        내 대출 도서
      </Heading>

      {isLoading && (
        <Flex justify="center" py={8}>
          <Spinner />
        </Flex>
      )}

      {error && (
        <Callout type="error">{extractErrorMessage(error as Error)}</Callout>
      )}

      {data && (
        <>
          <Text fontSize="sm" color="gray.500" mb={3}>
            총 {items.length}권 대출 중
          </Text>

          {items.length === 0 ? (
            <Box py={8} textAlign="center">
              <Text color="gray.400">대출 중인 도서가 없습니다.</Text>
            </Box>
          ) : (
            <Flex direction="column" gap={2}>
              {items.map((item) => (
                <BorrowingCard key={item.itemId} item={item} />
              ))}
            </Flex>
          )}
        </>
      )}
    </Container>
  );
}
