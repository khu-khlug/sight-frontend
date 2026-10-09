import ContentSkeleton from "../../../../../components/ContentSkeleton";
import { GroupSearchApi } from "../../../../../api/public/group/GroupSearchApi";
import { useQuery } from "@tanstack/react-query";
import { Box, Input, RadioGroup, ScrollArea, Text } from "@chakra-ui/react";
import { X } from "lucide-react";
import { useState } from "react";

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
  groupId: number;
  enabledFilters: Set<LabelFilterKey>;
  onToggleFilter: (key: LabelFilterKey) => void;
};

const SEARCH_TARGETS = ["title", "record", "author"] as const;
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

  const normalizedQuery = query.trim().toLowerCase();
  const searchQuery = useQuery({
    queryKey: ["group-detail", groupId, "search", searchTarget, normalizedQuery],
    queryFn: () => searchTarget === "record"
      ? GroupSearchApi.searchGroupRecords(groupId, { keyword: normalizedQuery })
      : GroupSearchApi.searchGroupCards(groupId, { keyword: normalizedQuery, searchTarget }),
    enabled: Boolean(normalizedQuery),
  });
  const results = searchQuery.data ?? [];

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
          onValueChange={(details) => setSearchTarget((details.value as SearchTarget) ?? "title")}
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
          placeholder={`${SEARCH_TARGET_LABEL[searchTarget]}으로 검색`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          mb={2}
        />
      </Box>

      <Text fontSize="sm" fontWeight="medium" px="15px" mb={2}>
        검색결과
      </Text>
      <ScrollArea.Root className={styles.resultsArea} size="sm" variant="hover">
        <ScrollArea.Viewport h="100%" style={{ overflowX: "hidden" }}>
          <ScrollArea.Content w="100%" className={styles.results}>
            {!normalizedQuery ? (
              <Text fontSize="sm" color="gray.400">
                검색어를 입력해주세요.
              </Text>
            ) : searchQuery.isPending ? (<ContentSkeleton />) : searchQuery.isError ? (<Text role="alert">검색하지 못했습니다.</Text>) : results.length === 0 ? (
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
    </Box>
  );
}
