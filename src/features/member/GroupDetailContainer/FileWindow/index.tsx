import ContentSkeleton from "../../../../components/ContentSkeleton";
import SkeletonWrapper from "../../../../components/SkeletonWrapper";
import { Box, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { WrapText, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";

import AppTooltip from "../../../../components/AppTooltip";
import { getGitHostIconSlug } from "../../../../components/GitRepoBadge";
import KhlugIcon from "../../../../components/KhlugIcon";
import { ScrollBox } from "../../../../components/ScrollBox";
import SimpleIcon from "../../../../components/SimpleIcon";
import { cn } from "../../../../util/cn";
import { fileApi, sideForRole } from "../actions";
import Window from "../Window";
import { DualWindowActions, SingleWindowActions } from "../Window/HeaderActions";
import windowStyles from "../Window/style.module.css";
import { WindowBinding } from "../WindowLayer";
import { useGroupDetailPageState } from "../pageState";
import FileToolbar from "./FileToolbar";
import styles from "./style.module.css";
import { TEXT_FONT_SIZES, type FileWindowContent, type TextFontSize } from "./types";

type Props = {
  binding: WindowBinding;
  content: FileWindowContent;
  // 줄바꿈은 pageState에 직접 바인딩한다. 글자 크기는 기존처럼 페이지에서 전달받는다.
  textFontSize: TextFontSize;
  onChangeTextFontSize: (direction: 1 | -1) => void;
};

const TEXT_FONT_SIZE_PX: Record<TextFontSize, number> = { sm: 12, md: 13, lg: 15 };

type FileKind = "text" | "image" | "video" | "audio" | "pdf" | "unsupported";

const EXTENSION_KIND: Record<string, FileKind> = {
  txt: "text", md: "text", json: "text", ts: "text", tsx: "text", js: "text", jsx: "text",
  css: "text", html: "text", yaml: "text", yml: "text", toml: "text", py: "text", java: "text",
  go: "text", c: "text", cpp: "text", xml: "text", csv: "text",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image", bmp: "image",
  mp4: "video", webm: "video", mov: "video", mkv: "video",
  mp3: "audio", wav: "audio", ogg: "audio", m4a: "audio", flac: "audio",
  pdf: "pdf",
};

function detectFileKind(fileName: string): FileKind {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_KIND[extension] ?? "unsupported";
}

// BOM(byte order mark)으로만 판별한다 — BOM이 없으면 UTF-8로 가정한다(Blob.text()도 항상
// UTF-8로 디코딩하므로 화면에 보이는 내용과 일치한다. EUC-KR 등 다른 인코딩은 BOM이 없어서
// 구분할 수 없다).
function detectEncoding(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return "UTF-8 (BOM)";
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) return "UTF-16 LE";
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) return "UTF-16 BE";
  return "UTF-8";
}

function detectLineEnding(text: string): string {
  if (text.includes("\r\n")) return "CRLF";
  if (text.includes("\n")) return "LF";
  if (text.includes("\r")) return "CR";
  return "없음";
}

function TextFileContent({ content, wrap, onToggleWrap, fontSize, onChangeFontSize }: { content: FileWindowContent; wrap: boolean; onToggleWrap: () => void; fontSize: TextFontSize; onChangeFontSize: (direction: 1 | -1) => void }) {
  const query = useQuery({
    queryKey: ["file-window-text", content.fileUrl],
    // actions.ts의 fileApi가 이 url을 어떤 api로 가져와야 하는지 아는 단일 지점이다 — 텍스트
    // 렌더링용 text()·인코딩 판별용 원본 바이트·툴바에 보여줄 size를 한 번에 받아둔다.
    queryFn: async () => {
      const file = await fileApi.get(content.fileUrl);
      const [text, buffer] = await Promise.all([file.text(), file.blob.arrayBuffer()]);
      return { text, size: file.size, encoding: detectEncoding(new Uint8Array(buffer)), lineEnding: detectLineEnding(text) };
    },
  });
  // wrap=false(기본)면 줄을 안 꺾고 가로 스크롤, true면 자동 줄바꿈 — 가로 스크롤 영역이 필요
  // 없어지므로 가로 HoverScrollbar도 그때만 숨긴다. 이 설정은 페이지(GroupDetailContainer)가
  // 들고 있어서, 다른 파일을 열어도 페이지를 나가기 전까지 그대로 유지된다.
  if (query.isPending) return <ContentSkeleton />;
  if (query.isError) return <Text className={styles.unsupported}>파일을 불러오지 못했습니다.</Text>;
  const { text, size, encoding, lineEnding } = query.data;
  const lines = text.split("\n");
  // 줄 수를 미리 알아야 줄번호 칸의 폭(가장 큰 줄번호의 자릿수)을 렌더링 전에 고정할 수 있다 —
  // <col>에 줘서 테이블이 줄마다 다시 계산하지 않고 한 번에 이 폭으로 고정하게 한다.
  const lineNumberWidth = `${String(lines.length).length}ch`;
  const textStats = {
    lines: lines.length,
    charsWithSpaces: text.length,
    charsWithoutSpaces: text.replace(/\s/g, "").length,
    encoding,
    lineEnding,
  };
  return (
    <Box className={styles.viewerRoot}>
      <FileToolbar
        content={content}
        size={size}
        textStats={textStats}
        extraActions={(
          <>
            <AppTooltip placement="top" content="글자 작게">
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => onChangeFontSize(-1)}
                disabled={fontSize === TEXT_FONT_SIZES[0]}
              >
                <ZoomOut size={16} />
              </button>
            </AppTooltip>
            <AppTooltip placement="top" content="글자 크게">
              <button
                type="button"
                className={styles.toolbarButton}
                onClick={() => onChangeFontSize(1)}
                disabled={fontSize === TEXT_FONT_SIZES[TEXT_FONT_SIZES.length - 1]}
              >
                <ZoomIn size={16} />
              </button>
            </AppTooltip>
            <AppTooltip placement="top" content={wrap ? "좌우 스크롤" : "자동 줄바꿈"}>
              <button type="button" className={styles.toolbarButton} onClick={onToggleWrap}>
                <WrapText size={16} />
              </button>
            </AppTooltip>
          </>
        )}
      />
      <Box className={styles.textScrollArea}>
        <ScrollBox
          gutter={[0, 10, 10, 10]}
          horizontalMode={wrap ? "wrap" : "scroll"}
          verticalScrollbarClassName={windowStyles.scrollbar}
          horizontalScrollbarClassName={windowStyles.scrollbarHorizontal}
        >
          <table className={styles.codeTable} style={{ width: wrap ? "100%" : "max-content", fontSize: TEXT_FONT_SIZE_PX[fontSize] }}>
            <colgroup>
              <col style={{ width: lineNumberWidth }} />
              <col />
            </colgroup>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td className={styles.lineNumber}>{index + 1}</td>
                  <td className={cn(styles.lineText, wrap && styles.lineTextWrap)} style={{ display: "flex", flexDirection: "row" }}>
                    {/*아래 임시방편의 일부*/}
                    <span>{line}</span>{wrap ? null : <div style={{ width: "10px", height: "1px" }}></div>}
                  </td>
                </tr>
              ))}
              <tr style={{ height: "10px" /*아래 임시방편의 일부*/ }} ></tr>
            </tbody>
          </table>
        </ScrollBox>
        {/*
         * 임시방편: ScrollArea.Viewport의 overflow 클리핑이 왜 실패하는지 원인을 아직 못
         * 찾았다(콘텐츠가 뷰포트는 물론 .window 경계까지 넘어 보임) — 원인 조사로 다른 작업이
         * 더 늦어지지 않도록, 넘치는 부분을 실제로 자르는 대신 창 배경색과 같은 색 패널로
         * 오른쪽/아래 10px(= gutter 값과 동일)를 덮어서 시각적으로만 가린다. 진짜 클리핑이
         * 아니므로 마우스 이벤트가 아래 콘텐츠로 그대로 가게 pointerEvents:"none"을 준다.
         * DOM 순서만으로는 "마스크는 콘텐츠 위, 스크롤바는 마스크 위" 둘 다 만족 못 시켜서
         * (스크롤바는 <ScrollBox> 안쪽이라 더 깊이 있음) z-index로 쌓는 순서를 명시한다
         * (.clipMaskRight/.clipMaskBottom의 z-index보다 windowStyles.scrollbar/
         * scrollbarHorizontal의 z-index가 더 높아야 한다). 가로 스크롤이 아예 없는 wrap
         * 모드에서는 오른쪽에 가릴 넘침 자체가 없으므로 clipMaskRight는 scroll 모드에서만
         * 띄운다. 나중에 뷰포트 클리핑 실패 원인을 찾으면 이 Box들과 위 table의
         * marginRight/marginBottom(10px)을 같이 제거할 것.
         */}
        {!wrap && <Box className={styles.clipMaskRight} aria-hidden />}
        <Box className={styles.clipMaskBottom} aria-hidden />
      </Box>
    </Box>
  );
}

// blob을 img/video/iframe의 src로 쓰려면 URL.createObjectURL로 감싸야 한다 — blob이 바뀔
// 때만 새로 만들고, 더 이상 안 쓰는 objectURL은 바로 해제해서 메모리가 새지 않게 한다.
function useObjectUrl(blob: Blob | undefined): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return objectUrl;
}

// 텍스트가 아닌 모든 파일(이미지/비디오/오디오/PDF/미리보기 불가)이 공유한다 — 종류별
// 전용 액션이 없어서 FileToolbar의 extraActions는 안 쓴다.
function MediaFileContent({ content, fileName, kind }: { content: FileWindowContent; fileName: string; kind: Exclude<FileKind, "text"> }) {
  const query = useQuery({
    queryKey: ["file-window-blob", content.fileUrl],
    // fileApi가 이 url을 어떤 api로 가져와야 하는지 아는 단일 지점이다 — img/video/iframe은
    // url 문자열이 필요해서, 받아온 blob을 useObjectUrl로 감싸 쓴다.
    queryFn: () => fileApi.get(content.fileUrl),
  });
  const objectUrl = useObjectUrl(query.data?.blob);
  const renderMedia = () => {
    if (query.isPending || !objectUrl) return <ContentSkeleton />;
    if (query.isError) return <Text className={styles.unsupported}>파일을 불러오지 못했습니다.</Text>;
    if (kind === "image") return <img className={styles.image} src={objectUrl} alt={fileName} />;
    if (kind === "video") return <video className={styles.video} src={objectUrl} controls />;
    if (kind === "audio") return <audio className={styles.audio} src={objectUrl} controls />;
    if (kind === "pdf") return <iframe className={styles.pdfFrame} src={objectUrl} title={fileName} />;
    return <Text className={styles.unsupported}>미리볼 수 없는 파일 형식입니다.</Text>;
  };
  return (
    <Box className={styles.viewerRoot}>
      <FileToolbar content={content} size={query.data?.size} />
      <Box className={styles.mediaArea}>{renderMedia()}</Box>
    </Box>
  );
}

function FileContent({ content, textWrap, onToggleTextWrap, textFontSize, onChangeTextFontSize }: { content: FileWindowContent; textWrap: boolean; onToggleTextWrap: () => void; textFontSize: TextFontSize; onChangeTextFontSize: (direction: 1 | -1) => void }) {
  const { fileName } = content;
  const kind = detectFileKind(fileName);
  if (kind === "text") {
    return (
      <TextFileContent
        content={content}
        wrap={textWrap}
        onToggleWrap={onToggleTextWrap}
        fontSize={textFontSize}
        onChangeFontSize={onChangeTextFontSize}
      />
    );
  }
  return <MediaFileContent content={content} fileName={fileName} kind={kind} />;
}

// 저장소 파일 경로에서 "파일명 제외한 디렉터리" 부분만 뽑아낸다. 루트 파일(예: "README.md")은
// 디렉터리가 없어 빈 문자열이 된다.
function directoryOf(path: string): string {
  const segments = path.split("/");
  segments.pop();
  return segments.join("/");
}

function RepositoryHeaderLeft({ content }: { content: FileWindowContent & { source: "repository" } }) {
  let repoFullName = content.repositoryUrl;
  try {
    repoFullName = new URL(content.repositoryUrl).pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    // URL 파싱에 실패하면 원본 문자열을 그대로 쓴다.
  }
  const slug = getGitHostIconSlug(content.repositoryUrl);
  const directory = directoryOf(content.path);
  const grayText = directory ? `${repoFullName}/${directory}/` : `${repoFullName}/`;
  const fullPath = `${repoFullName}/${content.path}`;

  return (
    <AppTooltip
      placement="top"
      content={(
        <Box display="inline-flex" alignItems="center" gap="4px">
          {slug && <SimpleIcon slug={slug} size={14} />}
          <span>{fullPath}</span>
        </Box>
      )}
    >
      <Box className={styles.headerLeft}>
        {slug && <SimpleIcon slug={slug} size={16} />}
        <span className={styles.fileName}>{content.fileName}</span>
        <span className={styles.repoPath}>{grayText}</span>
      </Box>
    </AppTooltip>
  );
}

function HeaderLeft({ content }: { content: FileWindowContent }) {
  if (content.source === "repository") return <RepositoryHeaderLeft content={content} />;
  return (
    <Box className={styles.headerLeft}>
      <KhlugIcon size={18} />
      <span className={styles.fileName}>
        {content.source === "activityReport" ? "활동보고" : "첨부파일"}: {content.fileName}
      </span>
    </Box>
  );
}

export default function FileWindow({ binding, content, textFontSize, onChangeTextFontSize }: Props) {
  const { pageState, toggleTextWrap } = useGroupDetailPageState();
  const { role, minimized, isClosing, canGoDual, onToggleMinimize, onClose, onSwitchSide, onExpand, onSendToSide } = binding;
  const isDualLayer = role !== "single";
  const handleRequestClose = () => {
    onClose();
  };

  const middleActions = !isDualLayer
    ? <SingleWindowActions canGoDual={canGoDual} onSendToSide={onSendToSide} />
    : <DualWindowActions side={sideForRole(role === "main" ? "main" : "sub")} otherSideEmpty={binding.otherSideEmpty} onExpand={onExpand} onSwitchSide={onSwitchSide} />;

  return (
    <Window
      isSub={role === "sub"}
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
      isClosing={isClosing}
      onRequestClose={handleRequestClose}
      middleActions={middleActions}
      headerLeftTogglesMinimize={false}
      headerLeft={<HeaderLeft content={content} />}
    >
      <SkeletonWrapper className={cn(styles.content)}>
        <FileContent
          content={content}
          textWrap={pageState.textWrap}
          onToggleTextWrap={toggleTextWrap}
          textFontSize={textFontSize}
          onChangeTextFontSize={onChangeTextFontSize}
        />
      </SkeletonWrapper>
    </Window>
  );
}
