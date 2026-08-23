import { Box, Heading, Text, Textarea } from "@chakra-ui/react";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";

import Container from "../../../components/Container";
import MainLayout from "../../../layouts/MainLayout";
import styles from "./style.module.css";

const initialContent = `
  <h2>Tiptap 편집기 PoC</h2>
  <p>굵게, 기울임, 목록, 인용문, 링크와 이미지 URL 삽입을 시험해볼 수 있습니다.</p>
  <blockquote><p>이미지 파일 업로드는 별도 API 계약이 필요합니다.</p></blockquote>
`;

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.toolbarButton} ${active ? styles.active : ""}`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소를 입력하세요.", previousUrl ?? "https://");

    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertImage = () => {
    const url = window.prompt("이미지 URL을 입력하세요.");
    if (!url?.trim()) return;

    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  return (
    <div className={styles.toolbar}>
      <ToolbarButton label="실행 취소" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 size={18} />
      </ToolbarButton>
      <ToolbarButton label="다시 실행" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 size={18} />
      </ToolbarButton>
      <span className={styles.divider} />
      <ToolbarButton label="굵게" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton label="기울임" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={18} />
      </ToolbarButton>
      <ToolbarButton label="제목 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 size={18} />
      </ToolbarButton>
      <ToolbarButton label="글머리 목록" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton label="번호 목록" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered size={18} />
      </ToolbarButton>
      <ToolbarButton label="인용문" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={18} />
      </ToolbarButton>
      <ToolbarButton label="링크" active={editor.isActive("link")} onClick={setLink}>
        <Link2 size={18} />
      </ToolbarButton>
      <ToolbarButton label="이미지 URL 삽입" onClick={insertImage}>
        <ImagePlus size={18} />
      </ToolbarButton>
    </div>
  );
}

export default function TiptapPlaygroundPage() {
  const [html, setHtml] = useState(initialContent.trim());
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image,
    ],
    content: initialContent,
    onUpdate: ({ editor: updatedEditor }) => setHtml(updatedEditor.getHTML()),
  });

  return (
    <MainLayout>
      <Box mt={{ base: 4, md: 6 }}>
        <Container>
          <Box as="main" pt={0} pb={6}>
            <Heading size="xl">Tiptap 편집기 PoC</Heading>
            <Text mt={2} color="gray.600">테스트 전용 화면입니다. 이미지 파일 업로드와 저장 API는 아직 연결하지 않았습니다.</Text>

            {editor && (
              <Box mt={6} className={styles.editorShell}>
                <Toolbar editor={editor} />
                <EditorContent editor={editor} className={styles.editorContent} />
              </Box>
            )}

            <Box mt={6}>
              <Text fontWeight="semibold" mb={2}>현재 HTML 출력</Text>
              <Textarea value={html} readOnly rows={8} fontFamily="mono" fontSize="sm" />
            </Box>
          </Box>
        </Container>
      </Box>
    </MainLayout>
  );
}
