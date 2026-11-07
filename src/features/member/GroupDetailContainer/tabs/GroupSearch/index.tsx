import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { GroupSearchApi } from "../../../../../api/public/group/GroupSearchApi";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, IconButton, Input, RadioGroup, ScrollArea, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import AppTooltip from "../../../../../components/AppTooltip";
import HoverScrollbar from "../../../../../components/HoverScrollbar";
import {
  LABEL_COLOR_HEX,
  LABEL_COLOR_NAME,
  LABEL_COLORS,
  LabelFilterKey,
  NO_LABEL_FILTER_KEY,
} from "../../label";
import styles from "./style.module.css";

type Props = {
  groupId: string;
  enabledFilters: Set<LabelFilterKey>;
  onToggleFilter: (key: LabelFilterKey) => void;
};

const SEARCH_TARGETS = ["title", "record", "author"] as const;
const PAGE_BUTTON_COUNT = 5;
type SearchTarget = (typeof SEARCH_TARGETS)[number];
const SEARCH_TARGET_LABEL: Record<SearchTarget, string> = {
  title: "카드명",
  record: "기록",
  author: "생성자명",
};

/*
 * 라벨 필터는 여기(검색 탭)와 칸반보드가 같은 상태(GroupDetailContainer가 들고 있음)를
 * 공유하지만, 딱 칸반보드의 카드 어둡게 표시에만 쓰인다 — 검색 결과 목록은 라벨 필터와
 * 무관하게 검색대상 + 검색어로만 걸러진다.
 *
 * 라벨 필터/검색대상/검색창은 고정, 검색결과만 스크롤돼야 해서(요청) Dashboard가 공용
 * ScrollArea 대신 .tabArea 높이를 그대로 넘긴다(GroupChat과 같은 패턴) — 그래서 이 컴포넌트
 * 자신이 height: 100% 뼈대(.container)를 갖고, 결과 목록만 자기만의 ScrollArea를 쓴다.
 */
export default function GroupSearch({ groupId, enabledFilters, onToggleFilter }: Props) {
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("title");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [firstPage, setFirstPage] = useState(1);
  const [knownTotalPages, setKnownTotalPages] = useState(0);
  const resultsViewportRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const searchQuery = useQuery({
    queryKey: ["group-detail", groupId, "search", searchTarget, normalizedQuery, page],
    queryFn: ({ signal }) => {
      const request = { keyword: normalizedQuery, page };
      return searchTarget === "record"
        ? GroupSearchApi.searchGroupRecords(groupId, request, signal)
        : GroupSearchApi.searchGroupCards(groupId, { ...request, searchTarget }, signal);
    },
    enabled: Boolean(normalizedQuery),
  });
  const results = searchQuery.data?.results ?? [];
  // 다음 페이지를 불러오는 동안에도 페이지 버튼이 유지되도록 마지막으로 받은 페이지 수를 쓴다.
  const resultPages = searchQuery.data?.totalPages ?? knownTotalPages;
  const totalPages = Math.max(1, resultPages);
  const lastFirstPage = Math.max(1, totalPages - PAGE_BUTTON_COUNT + 1);
  const visibleFirstPage = Math.min(firstPage, lastFirstPage);
  const pages = Array.from(
    { length: Math.min(PAGE_BUTTON_COUNT, totalPages) },
    (_, index) => visibleFirstPage + index,
  );

  useEffect(() => {
    if (!searchQuery.data) return;
    setKnownTotalPages(searchQuery.data.totalPages);
    const updatedTotalPages = Math.max(1, searchQuery.data.totalPages);
    setPage((current) => Math.min(current, updatedTotalPages));
    setFirstPage((current) => Math.min(current, Math.max(1, updatedTotalPages - PAGE_BUTTON_COUNT + 1)));
  }, [searchQuery.data]);

  useEffect(() => {
    resultsViewportRef.current?.scrollTo({ top: 0 });
  }, [page, normalizedQuery, searchTarget]);

  function resetPagination() {
    setPage(1);
    setFirstPage(1);
    setKnownTotalPages(0);
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.filters}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          라벨 필터
        </Text>
        <Box className={styles.labelFilterRow} mb={5}>
          {LABEL_COLORS.map((color) => (
            <AppTooltip key={color} content={LABEL_COLOR_NAME[color]}>
              <Box
                as="button"
                className={styles.labelFilterDot}
                aria-label={LABEL_COLOR_NAME[color]}
                borderWidth="2px"
                borderColor={LABEL_COLOR_HEX[color]}
                bg={enabledFilters.has(color) ? LABEL_COLOR_HEX[color] : "transparent"}
                _active={{ transform: "scale(0.9)" }}
                onClick={() => onToggleFilter(color)}
              />
            </AppTooltip>
          ))}
          <AppTooltip content="라벨 없는 카드">
            <Box
              as="button"
              className={styles.labelFilterDot}
              aria-label="라벨 없는 카드"
              _active={{ transform: "scale(0.9)" }}
              onClick={() => onToggleFilter(NO_LABEL_FILTER_KEY)}
            >
            {/*
              검정 아이콘(.noLabelMarkBase)은 켜짐/꺼짐 상관없이 항상 같은 크기·굵기로,
              항상 그린다 — 이게 둘 사이에서 절대 안 바뀌는 부분이다. 차이는 오직 그 위에
              더 작은 흰 아이콘(.noLabelMarkOverlay)이 있냐 없냐뿐이다(꺼짐일 때만 그림).
            */}
            <span className={styles.noLabelMarkWrap}>
              <X
                strokeWidth={enabledFilters.has(NO_LABEL_FILTER_KEY) ? 3 : 5}
                className={styles.noLabelMarkBase}
                aria-hidden
              />
              {!enabledFilters.has(NO_LABEL_FILTER_KEY) && (
                <X strokeWidth={2} className={styles.noLabelMarkOverlay} aria-hidden />
              )}
            </span>
            </Box>
          </AppTooltip>
        </Box>

        <Text fontSize="sm" fontWeight="medium" mb={2}>
          검색대상
        </Text>
        <RadioGroup.Root
          value={searchTarget}
          onValueChange={(details) => {
            setSearchTarget((details.value as SearchTarget) ?? "title");
            resetPagination();
          }}
          mb={4}
        >
          <Box display="flex" gap="8px">
            {SEARCH_TARGETS.map((target) => (
              <RadioGroup.Item key={target} value={target} className={styles.searchTargetItem}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemText>{SEARCH_TARGET_LABEL[target]}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </Box>
        </RadioGroup.Root>

        <Input
          size="sm"
          // 서버는 검색어를 20자까지 받는다.
          maxLength={20}
          placeholder={`${SEARCH_TARGET_LABEL[searchTarget]}으로 검색`}
          value={query}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            if (nextQuery.trim().toLowerCase() !== normalizedQuery) resetPagination();
          }}
          mb={2}
        />
      </Box>

      <Text fontSize="sm" fontWeight="medium" px="15px" mb={2}>
        검색결과
      </Text>
      <ScrollArea.Root className={styles.resultsArea} size="sm" variant="hover">
        <ScrollArea.Viewport ref={resultsViewportRef} h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" className={styles.results}>
            {!normalizedQuery ? (
              <Text fontSize="sm" color="gray.400">
                검색어를 입력해주세요.
              </Text>
            ) : searchQuery.isPending ? (<ContentSkeleton />) : searchQuery.isError ? (
              <Box>
                <Text role="alert">검색하지 못했습니다.</Text>
                <Button size="xs" mt={2} onClick={() => void searchQuery.refetch()}>다시 시도</Button>
              </Box>
            ) : results.length === 0 ? (
              <Text fontSize="sm" color="gray.400">
                결과가 없습니다.
              </Text>
            ) : (
              results.map((result) => (
                <Box key={result.id} className={styles.resultItem} bg="whiteAlpha.800">
                  <Text fontSize="xs" color="gray.400">
                    {result.listTitle}
                  </Text>
                  <Text fontSize="sm" fontWeight="medium">
                    {result.cardTitle}
                  </Text>
                  {result.matchedText && (
                    <Text fontSize="xs" color="gray.500" wordBreak="break-all">
                      {result.matchedText}
                    </Text>
                  )}
                </Box>
              ))
            )}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <HoverScrollbar />
      </ScrollArea.Root>
      <Box as="nav" aria-label="검색 결과 페이지" className={styles.pagination}>
        {totalPages > PAGE_BUTTON_COUNT && <IconButton
          aria-label="이전 페이지 번호 보기"
          size="xs"
          variant="ghost"
          disabled={!normalizedQuery || visibleFirstPage === 1}
          onClick={() => setFirstPage(visibleFirstPage - 1)}
        >
          <ChevronLeft size={16} />
        </IconButton>}
        {pages.map((number) => (
          <Button
            key={number}
            size="xs"
            minW="28px"
            px={1}
            variant={number === page ? "solid" : "ghost"}
            aria-label={`${number}페이지`}
            aria-current={number === page ? "page" : undefined}
            disabled={!normalizedQuery || resultPages === 0}
            onClick={() => setPage(number)}
          >
            {number}
          </Button>
        ))}
        {totalPages > PAGE_BUTTON_COUNT && <IconButton
          aria-label="다음 페이지 번호 보기"
          size="xs"
          variant="ghost"
          disabled={!normalizedQuery || visibleFirstPage >= lastFirstPage}
          onClick={() => setFirstPage(visibleFirstPage + 1)}
        >
          <ChevronRight size={16} />
        </IconButton>}
      </Box>
    </Box>
  );
}
