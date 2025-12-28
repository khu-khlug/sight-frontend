import { Box, Flex, Heading, NativeSelect } from "@chakra-ui/react";

interface FinanceHeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const FinanceHeader = ({
  selectedYear,
  onYearChange,
}: FinanceHeaderProps) => {
  const currentYear = new Date().getFullYear();

  // 연도 선택 옵션 생성 (2020년부터 현재 연도까지)
  const yearOptions = Array.from(
    { length: currentYear - 2020 + 1 },
    (_, i) => 2020 + i
  ).reverse();

  const accountInfo = "하나은행 534-910013-94604 경희대학교 쿠러그";

  return (
    <Box mb={6}>
      <Flex align="center" gap={4} mb={3}>
        <Heading size="lg">동아리비 장부</Heading>
        <NativeSelect.Root w="auto" maxW="150px">
          <NativeSelect.Field
            value={selectedYear.toString()}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>

      <Box
        my={4}
        py={3}
        px={4}
        bg="#e3f2fd"
        borderRadius="md"
        fontSize="sm"
        color="#1565c0"
        textAlign="center"
      >
        회비 납부 계좌: {accountInfo}
      </Box>
    </Box>
  );
};

export default FinanceHeader;
