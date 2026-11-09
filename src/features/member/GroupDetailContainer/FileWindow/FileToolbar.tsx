import { Box, Text } from "@chakra-ui/react";
import { Download } from "lucide-react";
import { ReactNode } from "react";

import AppTooltip from "../../../../components/AppTooltip";
import { formatFileSize } from "../../../../util/formatFileSize";
import styles from "./style.module.css";
import type { FileWindowContent } from "./types";

type TextStats = {
  lines: number;
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  encoding: string;
  lineEnding: string;
};

type Props = {
  content: FileWindowContent;
  // 아직 fetch가 안 끝났으면 undefined — 그동안 왼쪽 통계의 크기 칸이 빈 채로 둔다.
  size: number | undefined;
  // 텍스트 파일에서만 넘어온다 — 있으면 왼쪽 통계에 줄 수/글자 수/인코딩/줄바꿈 문자를 같이 보여준다.
  textStats?: TextStats;
  // 파일 종류별 전용 버튼(지금은 텍스트의 줄바꿈 토글) — 다운로드 버튼 앞에 끼워 넣는다.
  extraActions?: ReactNode;
};

/*
 * "파일 정보" 버튼(모달로 파일명/크기/인코딩 등을 보여주던 것)은 지금은 필요 없어서 꺼뒀다 —
 * 나중에 다시 필요해지면 이 블록과 아래 toolbarActions의 버튼, showInfo/FileInfoModal 사용
 * 부분을 되살리면 된다. 인코딩/줄바꿈 문자는 모달 대신 아래 stats 줄에 직접 보여준다.
 *
 * import { Dialog, Portal } from "@chakra-ui/react";
 * import { Info } from "lucide-react";
 * import { useState } from "react";
 *
 * function InfoRow({ label, value }: { label: string; value: string }) {
 *   return (
 *     <Box display="flex" justifyContent="space-between" gap="16px">
 *       <Text color="gray.500" fontSize="sm" flexShrink={0}>{label}</Text>
 *       <Text fontSize="sm" textAlign="right" wordBreak="break-all">{value}</Text>
 *     </Box>
 *   );
 * }
 *
 * // BaseModal을 그대로 쓰면 가로만 중앙 정렬되고 세로는 위쪽에 치우친다(Chakra dialog
 * // 레시피의 positioner가 justifyContent만 center고 alignItems는 없어서, Content의 상단
 * // margin으로만 위치를 잡기 때문). BaseModal은 다른 여러 모달이 같이 쓰는 공용 컴포넌트라
 * // 거기 레시피를 바꾸면 전부 영향을 받는다 — 이 모달만 상하좌우 중앙에 두려고 Dialog
 * // 프리미티브를 직접 써서 positioner에 alignItems:"center"를 준다.
 * function FileInfoModal({ isOpen, onClose, content, size, textStats }: { isOpen: boolean; onClose: () => void; content: FileWindowContent; size: number | undefined; textStats?: TextStats }) {
 *   return (
 *     <Dialog.Root open={isOpen} onOpenChange={(details) => { if (!details.open) onClose(); }}>
 *       <Portal>
 *         <Dialog.Backdrop />
 *         <Dialog.Positioner alignItems="center">
 *           <Dialog.Content p="28px" maxW="400px" w="calc(100vw - 32px)" boxShadow="0px 0px 8px #00000018" borderRadius="8px" my="0">
 *             <Box display="flex" flexDirection="column" gap="10px">
 *               <Text fontSize="lg" fontWeight="bold">파일 정보</Text>
 *               <InfoRow label="파일명" value={content.fileName} />
 *               <InfoRow label="크기" value={size !== undefined ? formatFileSize(size) : "확인 중..."} />
 *               {textStats && (
 *                 <>
 *                   <InfoRow label="줄 수" value={`${textStats.lines.toLocaleString()}줄`} />
 *                   <InfoRow label="글자 수(공백 포함)" value={`${textStats.charsWithSpaces.toLocaleString()}자`} />
 *                   <InfoRow label="글자 수(공백 제외)" value={`${textStats.charsWithoutSpaces.toLocaleString()}자`} />
 *                   <InfoRow label="인코딩" value={textStats.encoding} />
 *                   <InfoRow label="줄바꿈 문자" value={textStats.lineEnding} />
 *                 </>
 *               )}
 *             </Box>
 *           </Dialog.Content>
 *         </Dialog.Positioner>
 *       </Portal>
 *     </Dialog.Root>
 *   );
 * }
 */

/*
 * 파일 창 콘텐츠 상단 툴바 — 왼쪽은 파일 통계(텍스트면 줄수/글자수/인코딩/줄바꿈 문자, 크기는
 * 공통), 오른쪽은 파일 종류별 전용 버튼(extraActions) + 다운로드 버튼. TextFileContent와
 * MediaFileContent가 그대로 재사용한다.
 */
export default function FileToolbar({ content, size, textStats, extraActions }: Props) {
  const stats = [
    textStats ? `${textStats.lines.toLocaleString()}줄` : null,
    textStats ? `${textStats.charsWithoutSpaces.toLocaleString()}자(공백포함 ${textStats.charsWithSpaces.toLocaleString()}자)` : null,
    textStats ? textStats.encoding : null,
    textStats ? textStats.lineEnding : null,
    size !== undefined ? formatFileSize(size) : null,
  ].filter((part): part is string => part !== null);
  return (
    <Box className={styles.toolbar}>
      <Box className={styles.toolbarActions}>
        <AppTooltip placement="top" content="다운로드">
          <a href={content.fileUrl} download={content.fileName} className={styles.toolbarButton} aria-label="다운로드">
            <Download size={16} />
          </a>
        </AppTooltip>
        {extraActions}
      </Box>
      <Text className={styles.toolbarStats}>{stats.join(" · ")}</Text>
    </Box>
  );
}
