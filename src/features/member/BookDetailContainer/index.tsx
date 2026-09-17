import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Flex,
  Text,
  Image,
  Button,
  Heading,
  Input,
  Textarea,
  Select,
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import AvailabilityBadge from "../../book/AvailabilityBadge";
import dayjs from "dayjs";

import Container from "../../../components/Container";
import Callout from "../../../components/Callout";
import {
  BookPublicApi,
  BookDetailDto,
  BookItemDto,
} from "../../../api/public/book";
import { BookManageApi } from "../../../api/manage/book";
import { UserPublicApi } from "../../../api/public/user";
import { extractErrorMessage } from "../../../util/extractErrorMessage";
import { DateFormats } from "../../../util/date";
import { BookCategory, BookCategoryLabel } from "../../../constant";
import { useIsManager } from "../../../hooks/user/useIsManager";

const categoryOptions = createListCollection({
  items: Object.values(BookCategory).map((category) => ({
    label: BookCategoryLabel[category],
    value: category,
  })),
});

function AvailabilityCard({
  book,
  onBorrow,
}: {
  book: BookDetailDto;
  onBorrow: () => void;
}) {
  return (
    <Box borderWidth={1} borderRadius="md" px={4} py={3}>
      <Flex align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={2}>
          <Text fontWeight="semibold" fontSize="md" flexShrink={0}>대출 가능</Text>
          <Text fontSize="sm" color="gray.500">{book.availableCount}/{book.totalCount}권</Text>
        </Flex>
        <Button size="sm" colorScheme="blue" flexShrink={0} onClick={onBorrow}>
          대출하기
        </Button>
      </Flex>
    </Box>
  );
}

function BorrowedCard({
  item,
  isMine,
  bookId,
}: {
  item: BookItemDto;
  isMine: boolean;
  bookId: string;
}) {
  const navigate = useNavigate();

  return (
    <Box borderWidth={1} borderRadius="md" px={4} py={3}>
      <Flex align="center" justify="space-between" gap={3}>
        <Text fontWeight="semibold" fontSize="md" flexShrink={0}>대출 중</Text>
        <Flex align="center" gap={2}>
          <Text fontSize="md">{item.borrowerInfo!.borrowerUserName}</Text>
          <Text fontSize="sm" color="gray.500">
            {dayjs(item.borrowerInfo!.borrowedAt).format(DateFormats.DATE)}
          </Text>
          {isMine ? (
            <Button
              size="sm"
              variant="outline"
              flexShrink={0}
              onClick={() =>
                navigate(`/book/scan?action=return&preset=${bookId}`)
              }
            >
              반납하기
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              flexShrink={0}
              onClick={() =>
                navigate(`/member/${item.borrowerInfo!.borrowerUserId}`)
              }
            >
              연락하기
            </Button>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

function BookDetail({
  book,
  currentUserId,
}: {
  book: BookDetailDto;
  currentUserId: number | null;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isManager } = useIsManager();
  const borrowedItems = book.itemList.filter((item) => item.borrowerInfo !== null);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [category, setCategory] = useState<BookCategory>(book.category);
  const [author, setAuthor] = useState(book.author);
  const [publisher, setPublisher] = useState(book.publisher);
  const [publishedYear, setPublishedYear] = useState(book.publishedYear);
  const [description, setDescription] = useState(book.description);
  const [coverImageUrl, setCoverImageUrl] = useState(book.coverImageUrl);

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () =>
      BookManageApi.updateBook(book.bookId, {
        title,
        author,
        publisher,
        publishedYear,
        coverImageUrl,
        description,
        category,
      }),
    onSuccess: () => {
      toast.success("도서 정보가 수정되었습니다.", { autoClose: 1000, hideProgressBar: true });
      queryClient.invalidateQueries({ queryKey: ["book", book.bookId] });
      setIsEditing(false);
    },
    onError: (e) => {
      toast.error(extractErrorMessage(e as Error));
    },
  });

  const handleStartEdit = () => {
    setTitle(book.title);
    setCategory(book.category);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setPublishedYear(book.publishedYear);
    setDescription(book.description);
    setCoverImageUrl(book.coverImageUrl);
    setIsEditing(true);
  };

  return (
    <Container>
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="xl">도서 정보</Heading>
        {isManager && !isEditing && (
          <Button size="sm" variant="outline" onClick={handleStartEdit}>
            정보 수정
          </Button>
        )}
        {isEditing && (
          <Flex gap={2}>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              취소
            </Button>
            <Button size="sm" colorScheme="blue" onClick={() => save()} loading={isSaving}>
              저장
            </Button>
          </Flex>
        )}
      </Flex>
      {/* 섹션 1+2: 표지 + 정보 (세로형: 세로 배치, 가로형: 가로 배치) */}
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          "@media (orientation: landscape)": {
            flexDirection: "row",
            alignItems: "flex-start",
          },
        }}
      >
        {/* 표지 */}
        <Box
          css={{
            "@media (orientation: landscape)": {
              width: "160px",
              flexShrink: 0,
            },
          }}
        >
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              maxH="280px"
              w="auto"
              maxW="100%"
              mx="auto"
              display="block"
              borderRadius="6px"
            />
          ) : (
            <Box
              css={{
                width: "100%",
                height: "200px",
                background: "var(--chakra-colors-gray-200)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "@media (orientation: landscape)": {
                  height: "220px",
                },
              }}
            >
              <Text fontSize="xs" color="gray.500">
                표지 없음
              </Text>
            </Box>
          )}
          {isEditing && (
            <Input
              mt={2}
              size="sm"
              placeholder="표지 이미지 URL"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          )}
        </Box>

        {/* 정보 섹션 (description 제외) */}
        <Flex direction="column" gap={3} flex={1} pt={2}>
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fontSize="xl"
              fontWeight="bold"
            />
          ) : (
            <Heading size="xl" fontWeight="bold" lineHeight="1.3">
              {book.title}
            </Heading>
          )}
          <Box
            as="table"
            style={{ borderCollapse: "collapse" }}
            fontSize="md"
            color="gray.700"
          >
            <tbody>
              <tr>
                <Box as="td" pr={3} py="2px" whiteSpace="nowrap" color="gray.500" verticalAlign="top">카테고리</Box>
                <Box as="td" py="2px">
                  {isEditing ? (
                    <Select.Root
                      size="sm"
                      collection={categoryOptions}
                      value={[category]}
                      onValueChange={(e) => setCategory(e.value[0] as BookCategory)}
                    >
                      <Select.Trigger>
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.Positioner>
                        <Select.Content>
                          {categoryOptions.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Root>
                  ) : (
                    book.category && BookCategoryLabel[book.category]
                  )}
                </Box>
              </tr>
              <tr>
                <Box as="td" pr={3} py="2px" whiteSpace="nowrap" color="gray.500" verticalAlign="top">저자</Box>
                <Box as="td" py="2px">
                  {isEditing ? (
                    <Input size="sm" value={author} onChange={(e) => setAuthor(e.target.value)} />
                  ) : (
                    book.author.replace(/\^/g, ", ")
                  )}
                </Box>
              </tr>
              <tr>
                <Box as="td" pr={3} py="2px" whiteSpace="nowrap" color="gray.500" verticalAlign="top">출판사</Box>
                <Box as="td" py="2px">
                  {isEditing ? (
                    <Input size="sm" value={publisher} onChange={(e) => setPublisher(e.target.value)} />
                  ) : (
                    book.publisher
                  )}
                </Box>
              </tr>
              <tr>
                <Box as="td" pr={3} py="2px" whiteSpace="nowrap" color="gray.500" verticalAlign="top">발행연도</Box>
                <Box as="td" py="2px">
                  {isEditing ? (
                    <Input
                      size="sm"
                      value={publishedYear}
                      onChange={(e) => setPublishedYear(e.target.value)}
                    />
                  ) : (
                    book.publishedYear
                  )}
                </Box>
              </tr>
              <tr>
                <Box as="td" pr={3} py="2px" whiteSpace="nowrap" color="gray.500" verticalAlign="top">ISBN</Box>
                <Box as="td" py="2px">{book.isbn}</Box>
              </tr>
            </tbody>
          </Box>
          <Flex align="center" gap={2}>
            <AvailabilityBadge availableCount={book.availableCount} size="md" />
            <Text fontSize="md" color="gray.600">
              {book.availableCount}/{book.totalCount}권
            </Text>
          </Flex>
        </Flex>
      </Box>

      {/* 섹션 3: 설명 + 아이템 리스트 */}
      <Box mt={6} borderTopWidth={1} pt={5}>
        {isEditing ? (
          <Box mb={5} pb={5} borderBottomWidth={1}>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              fontSize="md"
            />
          </Box>
        ) : (
          book.description && (
            <Box mb={5} pb={5} borderBottomWidth={1}>
              <Text fontSize="md" color="gray.600" lineHeight="1.7">
                {book.description}
              </Text>
            </Box>
          )
        )}

        <Heading size="md" mb={3}>
          소장 목록
        </Heading>
        <Flex direction="column" gap={2}>
          {book.availableCount > 0 && (
            <AvailabilityCard
              book={book}
              onBorrow={() =>
                navigate(`/book/scan?action=borrow&preset=${book.bookId}`)
              }
            />
          )}
          {borrowedItems.map((item) => (
            <BorrowedCard
              key={item.itemId}
              item={item}
              isMine={
                currentUserId !== null &&
                item.borrowerInfo!.borrowerUserId === currentUserId
              }
              bookId={book.bookId}
            />
          ))}
        </Flex>
      </Box>
    </Container>
  );
}

export default function BookDetailContainer({ bookId }: { bookId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => BookPublicApi.getBook(bookId),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: UserPublicApi.getCurrentUser,
  });

  if (isLoading) {
    return (
      <Container>
        <Flex justify="center" py={12}>
          <Spinner />
        </Flex>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Callout type="error">{extractErrorMessage(error as Error)}</Callout>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container>
        <Callout type="error">존재하지 않는 도서입니다.</Callout>
      </Container>
    );
  }

  return (
    <BookDetail
      book={data}
      currentUserId={currentUser ? currentUser.id : null}
    />
  );
}
