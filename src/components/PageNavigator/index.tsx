import { ChevronLeft, ChevronRight } from "lucide-react";

import styles from "./style.module.css";

const MAX_PAGE_COUNT = 7;

type Props = {
  currentPage: number;
  countPerPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export default function PageNavigator({
  currentPage,
  countPerPage,
  totalCount,
  onPageChange,
}: Props) {
  const totalPages = Math.ceil(totalCount / countPerPage);

  const startPage = Math.min(
    Math.max(1, currentPage - Math.floor(MAX_PAGE_COUNT / 2)),
    totalPages - MAX_PAGE_COUNT + 1
  );
  const endPage = Math.min(totalPages, startPage + MAX_PAGE_COUNT - 1);

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => i + startPage
  );

  return (
    <div className={styles["page-navigator"]}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          className={page === currentPage ? styles["current"] : ""}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
