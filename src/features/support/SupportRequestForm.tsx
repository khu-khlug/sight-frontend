import { Box, Input, NativeSelect, Textarea, VStack } from "@chakra-ui/react";
import { FormEvent, useState } from "react";

import { SupportRequestCategory, SupportRequestInput, supportRequestCategories } from "../../api/supportRequest";
import Button from "../../components/Button";
import Callout from "../../components/Callout";
import { supportRequestCategoryLabels } from "./category";

type Props = {
  initialValue?: SupportRequestInput;
  submitLabel: string;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (input: SupportRequestInput) => void;
  onCancel?: () => void;
};

export default function SupportRequestForm({
  initialValue,
  submitLabel,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [category, setCategory] = useState<SupportRequestCategory | "">(initialValue?.category ?? "");
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [content, setContent] = useState(initialValue?.content ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!category) {
      setValidationError("카테고리를 선택하세요.");
      return;
    }
    if (!title.trim()) {
      setValidationError("제목을 입력하세요.");
      return;
    }
    if (title.length > 255) {
      setValidationError("제목은 255자 이하로 입력하세요.");
      return;
    }
    if (!content.trim()) {
      setValidationError("내용을 입력하세요.");
      return;
    }

    setValidationError(null);
    onSubmit({ category, title, content });
  };

  return (
    <form onSubmit={submit}>
      <Box w="full">
        <VStack align="stretch" gap={4}>
        <Box>
          <label htmlFor="support-category">카테고리</label>
          <NativeSelect.Root mt={1} maxW="240px">
            <NativeSelect.Field
              id="support-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as SupportRequestCategory | "")}
            >
              <option value="">선택하세요</option>
              {supportRequestCategories.map((item) => (
                <option key={item} value={item}>{supportRequestCategoryLabels[item]}</option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>
        <Box>
          <label htmlFor="support-title">제목</label>
          <Input
            id="support-title"
            mt={1}
            value={title}
            maxLength={255}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSubmitting}
          />
        </Box>
        <Box>
          <label htmlFor="support-content">내용</label>
          <Textarea
            id="support-content"
            mt={1}
            rows={10}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={isSubmitting}
          />
        </Box>
        {(validationError || error) && <Callout type="error">{validationError ?? error}</Callout>}
        <Box display="flex" gap={2} justifyContent="flex-end">
          {onCancel && <Button type="button" variant="neutral" disabled={isSubmitting} onClick={onCancel}>취소</Button>}
          <Button type="submit" disabled={isSubmitting}>{submitLabel}</Button>
        </Box>
        </VStack>
      </Box>
    </form>
  );
}
