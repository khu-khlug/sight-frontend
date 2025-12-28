import { ChevronLeft, ChevronRight } from "lucide-react";
import { Flex, IconButton, Button } from "@chakra-ui/react";

const MAX_PAGE_COUNT = 7;

type Props = {
  currentPage: number;
  countPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

function calcPageNumbers(
  currentPage: number,
  countPerPage: number,
  totalCount: number
): number[] {
  const totalPages = Math.ceil(totalCount / countPerPage);
  const halfCount = Math.floor(MAX_PAGE_COUNT / 2);

  const pages: number[] = [];

  if (totalPages === 0) {
    return [1];
  }

  if (totalPages <= MAX_PAGE_COUNT) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= halfCount) {
    // 왼쪽 끝
    for (let i = 1; i <= MAX_PAGE_COUNT; i++) {
      pages.push(i);
    }
  } else if (currentPage > totalPages - halfCount) {
    // 오른쪽 끝
    for (let i = totalPages - MAX_PAGE_COUNT + 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // 중앙 처리
    for (let i = currentPage - halfCount; i <= currentPage + halfCount; i++) {
      pages.push(i);
    }
  }

  return pages;
}

export default function PageNavigator({
  currentPage,
  countPerPage,
  totalCount,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(totalCount / countPerPage);

  const pages = calcPageNumbers(currentPage, countPerPage, totalCount);

  return (
    <Flex justify="center" align="center" gap={2}>
      <IconButton
        aria-label="이전 페이지"
        size="sm"
        variant="ghost"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      >
        <ChevronLeft size={14} />
      </IconButton>
      {pages.map((page) => (
        <Button
          key={page}
          size="sm"
          variant={page === currentPage ? "solid" : "ghost"}
          colorScheme={page === currentPage ? "blue" : "gray"}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      <IconButton
        aria-label="다음 페이지"
        size="sm"
        variant="ghost"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      >
        <ChevronRight size={14} />
      </IconButton>
    </Flex>
  );
}
