import { Box, Heading, Text, Textarea } from "@chakra-ui/react";
import { useState } from "react";

import Container from "../../../components/Container";
import TiptapEditor from "../../../components/TiptapEditor";
import MainLayout from "../../../layouts/MainLayout";

const initialContent = `
  <h2>Tiptap 편집기 PoC</h2>
  <p>굵게, 기울임, 목록, 인용문, 링크와 이미지 URL 삽입을 시험해볼 수 있습니다.</p>
  <blockquote><p>이미지 파일 업로드는 별도 API 계약이 필요합니다.</p></blockquote>
`;

export default function TiptapPlaygroundPage() {
  const [html, setHtml] = useState(initialContent.trim());

  return (
    <MainLayout>
      <Box mt={{ base: 4, md: 6 }}>
        <Container>
          <Box as="main" pt={0} pb={6}>
            <Heading size="xl">Tiptap 편집기 PoC</Heading>
            <Text mt={2} color="gray.600">테스트 전용 화면입니다. 이미지 파일 업로드와 저장 API는 아직 연결하지 않았습니다.</Text>

            <Box mt={6}>
              <TiptapEditor initialValue={initialContent} onChange={setHtml} />
            </Box>

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
