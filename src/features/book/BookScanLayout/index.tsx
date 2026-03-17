import { Box, Flex, Text, Image, Heading } from "@chakra-ui/react";
import AvailabilityBadge from "../AvailabilityBadge";
import Container from "../../../components/Container";
import { BookDetailDto } from "../../../api/public/book";

type Props = {
  title: string;
  scanSection: React.ReactNode;
  book?: BookDetailDto | null;
};

function BookInfoSection({ book }: { book: BookDetailDto }) {
  return (
    <Box
      css={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        "@media (orientation: landscape)": {
          flexDirection: "row",
          alignItems: "flex-start",
        },
      }}
    >
      {/* 표지 */}
      {book.coverImageUrl ? (
        <Image
          src={book.coverImageUrl}
          alt={book.title}
          css={{
            width: "100%",
            maxHeight: "240px",
            objectFit: "contain",
            borderRadius: "6px",
            "@media (orientation: landscape)": {
              width: "120px",
              maxHeight: "none",
              flexShrink: 0,
            },
          }}
        />
      ) : (
        <Box
          css={{
            width: "100%",
            height: "160px",
            background: "var(--chakra-colors-gray-200)",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "@media (orientation: landscape)": {
              width: "120px",
              flexShrink: 0,
            },
          }}
        >
          <Text fontSize="xs" color="gray.500">
            표지 없음
          </Text>
        </Box>
      )}

      {/* 정보 */}
      <Flex direction="column" gap={2} flex={1}>
        <Text fontWeight="semibold" fontSize="lg">
          {book.title}
        </Text>
        {book.author && (
          <Text fontSize="sm" color="gray.600">
            {book.author}
          </Text>
        )}
        {book.publisher && (
          <Text fontSize="sm" color="gray.500">
            {book.publisher}
            {book.publishedYear ? ` · ${book.publishedYear}` : ""}
          </Text>
        )}
        <Flex align="center" gap={2}>
          <AvailabilityBadge availableCount={book.availableCount} />
          <Text fontSize="xs" color="gray.400">
            {book.availableCount}/{book.totalCount}
          </Text>
        </Flex>
        {book.description && (
          <Text fontSize="sm" color="gray.500" mt={1}>
            {book.description}
          </Text>
        )}
      </Flex>
    </Box>
  );
}

export default function BookScanLayout({ title, scanSection, book }: Props) {
  return (
    <Container>
      <Heading size="xl" mb={3}>
        {title}
      </Heading>

      {/* 스캔 섹션 - 상단 고정 */}
      <Box mb={4}>{scanSection}</Box>

      {/* 책 정보 섹션 */}
      {book && (
        <Box borderTopWidth={1} pt={4}>
          <BookInfoSection book={book} />
        </Box>
      )}
    </Container>
  );
}
