import { VStack } from "@chakra-ui/react";

import AddTransactionFormContainer from "../../features/manage/AddTransactionFormContainer";
import FinanceListContainer from "../../features/member/FinanceListContainer";
import MainLayout from "../../layouts/MainLayout";
import { useIsManager } from "../../hooks/user/useIsManager";

export default function FinancePage() {
  const { isManager } = useIsManager();

  return (
    <MainLayout>
      <VStack
        as="main"
        gap={0}
        align="stretch"
        maxW="1024px"
        mx="auto"
        w="full"
        px={{ base: 2, md: 4 }}
        mt={4}
      >
        {isManager && <AddTransactionFormContainer />}
        <FinanceListContainer />
      </VStack>
    </MainLayout>
  );
}
