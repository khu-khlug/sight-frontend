import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Box,
  VStack,
  Input,
  Stack,
  RadioGroup,
  Heading,
  Text,
} from "@chakra-ui/react";

import Button from "../../../components/Button";
import Container from "../../../components/Container";

import { FinanceApi, TransactionType } from "../../../api/manage/finance";
import { extractErrorMessage } from "../../../util/extractErrorMessage";

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export default function AddTransactionFormContainer() {
  const queryClient = useQueryClient();

  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [usedAt, setUsedAt] = useState<string>(getTodayDate());
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [amount, setAmount] = useState<number>(0);
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");

  // 단가와 수량이 변경될 때마다 금액 자동 계산
  useEffect(() => {
    const price = parseFloat(unitPrice) || 0;
    const qty = parseFloat(quantity) || 0;
    setAmount(price * qty);
  }, [unitPrice, quantity]);

  const { mutate, isPending } = useMutation({
    mutationFn: FinanceApi.createTransaction,
    onSuccess: () => {
      // 모든 finance 쿼리 무효화 (연도, 페이지 관계없이)
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      toast.success("장부 내역이 추가되었습니다.");

      // 폼 초기화
      setUsedAt(getTodayDate());
      setDescription("");
      setUnitPrice("");
      setQuantity("1");
      setPlace("");
      setNote("");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate({
      type,
      date: usedAt,
      description,
      unitPrice: parseFloat(unitPrice),
      quantity: parseInt(quantity, 10),
      amount: amount,
      place,
      note,
    });
  };

  return (
    <Container>
      <Heading size="md" mb={4}>
        항목 추가
      </Heading>
      <Box as="form" onSubmit={handleSubmit}>
        <Stack gap={4}>
          {/* 첫 번째 행: 구분, 날짜, 항목 */}
          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">구분</Text>
              <RadioGroup.Root
                value={type}
                onValueChange={(e) => setType(e.value as TransactionType)}
              >
                <Stack direction="row" gap={4}>
                  <RadioGroup.Item value={TransactionType.INCOME}>
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>수입</RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value={TransactionType.EXPENSE}>
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator />
                    <RadioGroup.ItemText>지출</RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Stack>
              </RadioGroup.Root>
            </VStack>

            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">날짜 *</Text>
              <Input
                type="date"
                value={usedAt}
                onChange={(e) => setUsedAt(e.target.value)}
                required
              />
            </VStack>

            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">항목 *</Text>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 2025-2학기 회비"
                required
              />
            </VStack>
          </Stack>

          {/* 두 번째 행: 단가, 수량, 금액 */}
          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">단가 *</Text>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </VStack>

            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">수량 *</Text>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                required
              />
            </VStack>

            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">금액 (자동 계산)</Text>
              <Input
                type="text"
                value={amount.toLocaleString("ko-KR")}
                readOnly
                bg="gray.50"
              />
            </VStack>
          </Stack>

          {/* 세 번째 행: 사용/수급처, 비고 */}
          <Stack direction={{ base: "column", md: "row" }} gap={4}>
            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">사용/수급처 *</Text>
              <Input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="예: 홍길동"
                required
              />
            </VStack>

            <VStack align="stretch" gap={2} flex={1}>
              <Text fontWeight="medium">비고 (선택)</Text>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="비고 입력"
              />
            </VStack>
          </Stack>

          {/* 제출 버튼 */}
          <Box textAlign="right">
            <Button type="submit" disabled={isPending}>
              추가
            </Button>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
}
