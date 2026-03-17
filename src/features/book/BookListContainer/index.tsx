import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Image,
  Button,
  Grid,
  Heading,
  chakra,
  Card,
} from "@chakra-ui/react";
import AvailabilityBadge from "../AvailabilityBadge";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import "./style.css";
import { BookPublicApi, BookListItemDto } from "../../../api/public/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

const PAGE_SIZE = 20;

type AvailableFilter = "all" | "available" | "unavailable";
type SortKey = "title-asc" | "title-desc" | "year-desc" | "year-asc";

function sortBooks(books: BookListItemDto[], sort: SortKey): BookListItemDto[] {
  return [...books].sort((a, b) => {
    switch (sort) {
      case "title-asc":
        return a.title.localeCompare(b.title, "ko");
      case "title-desc":
        return b.title.localeCompare(a.title, "ko");
      case "year-desc":
        return (b.publishedYear ?? 0) - (a.publishedYear ?? 0);
      case "year-asc":
        return (a.publishedYear ?? 0) - (b.publishedYear ?? 0);
    }
  });
}

function BookCard({ book }: { book: BookListItemDto }) {
  const navigate = useNavigate();

  return (
    <Card.Root
      cursor="pointer"
      overflow="hidden"
      transition="border-color 0.2s"
      _hover={{
        transition: "border-color 0.2s",
        borderColor: "var(--main-color)",
        transform: "translateY(-2px)",
      }}
      onClick={() => navigate(`/book/${book.bookId}`)}
    >
      {book.coverImageUrl ? (
        <Image
          src={book.coverImageUrl}
          alt={book.title}
          w="full"
          aspectRatio="3/4"
          objectFit="cover"
          loading="lazy"
        />
      ) : (
        <Box
          w="full"
          aspectRatio="3/4"
          bg="gray.200"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="xs" color="gray.500">
            표지 없음
          </Text>
        </Box>
      )}
      <Card.Body p={2} gap={1} display="flex" flexDirection="column" flex={1}>
        <Text fontWeight="semibold" fontSize="sm" lineClamp={2}>
          {book.title}
        </Text>
        {book.author && (
          <Text fontSize="xs" color="gray.500" lineClamp={1}>
            {book.author.replace(/\^/g, ", ")}
          </Text>
        )}
        {(book.publisher || book.publishedYear) && (
          <Text fontSize="xs" color="gray.400" lineClamp={1}>
            {[book.publisher, book.publishedYear].filter(Boolean).join(" · ")}
          </Text>
        )}
        <Flex align="center" justify="space-between" mt="auto" pt={1}>
          <AvailabilityBadge availableCount={book.availableCount} />
          <Text fontSize="xs" color="gray.400">
            {book.availableCount}/{book.totalCount}
          </Text>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

export default function BookListContainer() {
  const [availableFilter, setAvailableFilter] =
    useState<AvailableFilter>("all");
  const [sort, setSort] = useState<SortKey>("title-asc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { status, data, error } = useQuery({
    queryKey: ["books"],
    queryFn: () => BookPublicApi.listBooks(),
  });

  const processed = useMemo(() => {
    if (!data) return [];
    let books = data.bookList;
    if (availableFilter === "available")
      books = books.filter((b) => b.availableCount > 0);
    else if (availableFilter === "unavailable")
      books = books.filter((b) => b.availableCount === 0);
    return sortBooks(books, sort);
  }, [data, availableFilter, sort]);

  const handleFilterChange = (value: AvailableFilter) => {
    setAvailableFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (value: SortKey) => {
    setSort(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <Container>
      <Heading size="xl" mb={4}>
        도서 목록
      </Heading>

      <Flex gap={2} mb={5} wrap="wrap" align="center" justify="space-between">
        <Flex gap={2} wrap="wrap">
          {(["all", "available", "unavailable"] as AvailableFilter[]).map(
            (f) => (
              <Button
                key={f}
                size="sm"
                variant={availableFilter === f ? "solid" : "outline"}
                colorScheme={availableFilter === f ? "blue" : "gray"}
                onClick={() => handleFilterChange(f)}
              >
                {f === "all"
                  ? "전체"
                  : f === "available"
                    ? "대출 가능"
                    : "대출 불가"}
              </Button>
            ),
          )}
        </Flex>
        <chakra.select
          fontSize="sm"
          w="160px"
          h="32px"
          px={2}
          borderWidth={1}
          borderRadius="md"
          borderColor="inherit"
          bg="white"
          value={sort}
          onChange={(e) => handleSortChange(e.target.value as SortKey)}
        >
          <option value="title-asc">도서명 가나다순</option>
          <option value="title-desc">도서명 역순</option>
          <option value="year-desc">발행연도 최신순</option>
          <option value="year-asc">발행연도 오래된순</option>
        </chakra.select>
      </Flex>

      {(() => {
        switch (status) {
          case "pending":
            return (
              <Grid
                templateColumns={{
                  base: "repeat(2, 1fr)",
                  sm: "repeat(3, 1fr)",
                  md: "repeat(4, 1fr)",
                }}
                gap={3}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <Box
                    key={i}
                    aspectRatio="3/4"
                    bg="gray.100"
                    borderRadius="md"
                  />
                ))}
              </Grid>
            );
          case "error":
            return <Callout type="error">{extractErrorMessage(error)}</Callout>;
          case "success":
            return processed.length === 0 ? (
              <Callout type="info">도서가 없습니다.</Callout>
            ) : (
              <>
                <Grid
                  templateColumns={{
                    base: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(4, 1fr)",
                  }}
                  gap={3}
                  mb={4}
                >
                  {processed.slice(0, visibleCount).map((book) => (
                    <BookCard key={book.bookId} book={book} />
                  ))}
                </Grid>
                {visibleCount < processed.length && (
                  <Button
                    w="full"
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  >
                    더보기 ({processed.length - visibleCount}권 남음)
                  </Button>
                )}
              </>
            );
        }
      })()}
    </Container>
  );
}
