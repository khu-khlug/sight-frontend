import { useState } from "react";
import { Box, Button, Flex, Text, Textarea } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./style.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullHeight?: boolean;
  minHeight?: string | number;
  disabled?: boolean;
};

type MobilePane = "preview" | "editor";

const DEFAULT_PLACEHOLDER = "마크다운을 입력하세요...";
const DEFAULT_MIN_HEIGHT = "420px";

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  fullHeight = false,
  minHeight = DEFAULT_MIN_HEIGHT,
  disabled = false,
}: Props) {
  const [mobilePane, setMobilePane] = useState<MobilePane>("editor");

  return (
    <Box className={styles.root} height={fullHeight ? "100%" : undefined} minHeight={minHeight}>
      <Flex
        className={styles.mobileSwitch}
        display={{ base: "flex", md: "none" }}
        role="tablist"
        aria-label="마크다운 편집 화면 전환"
      >
        <Button
          type="button"
          role="tab"
          aria-selected={mobilePane === "editor"}
          size="sm"
          flex={1}
          variant={mobilePane === "editor" ? "solid" : "outline"}
          bg={mobilePane === "editor" ? "gray.800" : "white"}
          color={mobilePane === "editor" ? "white" : "gray.700"}
          borderWidth={0}
          borderRadius={0}
          onClick={() => setMobilePane("editor")}
        >
          작성
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mobilePane === "preview"}
          size="sm"
          flex={1}
          variant={mobilePane === "preview" ? "solid" : "outline"}
          bg={mobilePane === "preview" ? "gray.800" : "white"}
          color={mobilePane === "preview" ? "white" : "gray.700"}
          borderWidth={0}
          borderRadius={0}
          onClick={() => setMobilePane("preview")}
        >
          미리보기
        </Button>
      </Flex>

      <Box className={styles.workspace}>
        <Box
          className={styles.previewPane}
          data-active-mobile={mobilePane === "preview"}
          height={fullHeight ? "100%" : undefined}
          minHeight={minHeight}
        >
          <Box className={styles.previewBody}>
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <Text className={styles.emptyPreview}>작성한 내용이 여기에 표시됩니다.</Text>
            )}
          </Box>
        </Box>

        <Box
          className={styles.editorPane}
          data-active-mobile={mobilePane === "editor"}
          height={fullHeight ? "100%" : undefined}
          minHeight={minHeight}
        >
          <Textarea
            className={styles.textarea}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            height={fullHeight ? "100%" : undefined}
            minHeight={minHeight}
          />
        </Box>
      </Box>
    </Box>
  );
}
