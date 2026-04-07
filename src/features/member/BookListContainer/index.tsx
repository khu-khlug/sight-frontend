import { useMemo, useRef, useState } from "react";
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
  IconButton,
  chakra,
  Card,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
import { Search, ChevronDown } from "lucide-react";
import AvailabilityBadge from "../../book/AvailabilityBadge";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import "./style.css";
import { BookPublicApi, BookListItemDto } from "../../../api/public/book";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

const PAGE_SIZE = 20;

type AvailableFilter = "all" | "available" | "unavailable";
type SortKey = "title-asc" | "title-desc" | "year-desc" | "year-asc";
type SearchCategory = "title" | "author" | "publisher";

const searchCategories = createListCollection({
  items: [
    { label: "제목", value: "title" },
    { label: "저자", value: "author" },
    { label: "출판사", value: "publisher" },
  ],
});

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
  const [searchCategory, setSearchCategory] =
    useState<SearchCategory>("title");
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState<{
    category: SearchCategory;
    query: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { status, data, error } = useQuery({
    queryKey: ["books"],
    queryFn: () => BookPublicApi.listBooks(),
  });

  const processed = useMemo(() => {
    if (!data) return [];
    let books = data.bookList;
    if (activeSearch && activeSearch.query.trim()) {
      const q = activeSearch.query.trim().toLowerCase();
      books = books.filter((b) => {
        switch (activeSearch.category) {
          case "title":
            return b.title.toLowerCase().includes(q);
          case "author":
            return (b.author ?? "").toLowerCase().includes(q);
          case "publisher":
            return (b.publisher ?? "").toLowerCase().includes(q);
        }
      });
    }
    if (availableFilter === "available")
      books = books.filter((b) => b.availableCount > 0);
    else if (availableFilter === "unavailable")
      books = books.filter((b) => b.availableCount === 0);
    return sortBooks(books, sort);
  }, [data, availableFilter, sort, activeSearch]);

  const handleFilterChange = (value: AvailableFilter) => {
    setAvailableFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (value: SortKey) => {
    setSort(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearch = () => {
    setActiveSearch({ category: searchCategory, query: searchInput });
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <Container>
      <Heading size="xl" mb={4}>
        도서 목록
      </Heading>

      <chakra.form
        mb={3}
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
      <Flex borderWidth={1} borderRadius="md" align="stretch" overflow="hidden" pr={1} gap={1}>
        <Select.Root
          collection={searchCategories}
          value={[searchCategory]}
          onValueChange={(e) => setSearchCategory(e.value[0] as SearchCategory)}
          size="sm"
          width="88px"
          flexShrink={0}
        >
          <Select.Trigger
            borderWidth={1}
            borderRadius="md"
            mt="-1px"
            mb="-1px"
            ml="-1px"
            h="calc(100% + 2px)"
          >
            <Select.ValueText />
            <Select.Indicator>
              <ChevronDown size={14} />
            </Select.Indicator>
          </Select.Trigger>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {searchCategories.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        <chakra.input
          ref={inputRef}
          flex={1}
          fontSize="sm"
          px={2}
          py={1}
          outline="none"
          border="none"
          placeholder="검색어를 입력하세요"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <IconButton
          aria-label="검색"
          size="sm"
          variant="ghost"
          borderRadius={0}
          onClick={handleSearch}
        >
          <Search size={16} />
        </IconButton>
      </Flex>
      </chakra.form>

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
